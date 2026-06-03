import os
import chromadb
from chromadb.utils import embedding_functions
from rank_bm25 import BM25Okapi
from state import ResearchState

def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> list[str]:
    """
    Splits text into chunks of chunk_size with overlap, preserving word boundaries where possible.
    """
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        if start + chunk_size >= text_len:
            chunks.append(text[start:])
            break
            
        end = start + chunk_size
        # Find a space boundary near the end
        boundary = text.rfind(" ", start, end)
        if boundary != -1 and boundary > start + chunk_size // 2:
            end = boundary
            
        chunks.append(text[start:end])
        start = end - overlap
        
    return chunks

def rag_agent(state: ResearchState) -> dict:
    """
    RAG agent node:
    - Parses search results
    - Chunks contents
    - Stores chunks in ChromaDB
    - Retrieves top 3 relevant chunks based on user query
    """
    query = state.get("query", "")
    search_results = state.get("search_results", [])
    session_id = state.get("session_id", "default_session")
    
    if not query:
        raise ValueError("Query cannot be empty for RAG agent.")
        
    # Initialize ChromaDB persistent client
    # Using ./chroma_db relative to backend execution directory
    client = chromadb.PersistentClient(path="./chroma_db")
    
    # Initialize the local embedding model
    emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    
    # Reset/recreate the collection to isolate this query's session
    collection_name = f"research_{session_id}"
    try:
        client.delete_collection(collection_name)
    except Exception:
        pass
        
    collection = client.create_collection(
        name=collection_name,
        embedding_function=emb_fn
    )
    
    documents = []
    metadatas = []
    ids = []
    
    chunk_counter = 0
    for doc_idx, result_str in enumerate(search_results):
        # Parse Title, URL, and Content from formatted string
        lines = result_str.split("\n", 2)
        title = "Untitled"
        url = ""
        content = result_str
        
        if len(lines) >= 3:
            if lines[0].startswith("Title: "):
                title = lines[0][7:]
            if lines[1].startswith("URL: "):
                url = lines[1][5:]
            if lines[2].startswith("Content: "):
                content = lines[2][9:]
                
        # Split content into smaller chunks
        chunks = chunk_text(content, chunk_size=800, overlap=150)
        for chunk_idx, chunk in enumerate(chunks):
            documents.append(chunk)
            metadatas.append({"title": title, "url": url})
            ids.append(f"doc_{doc_idx}_chunk_{chunk_idx}")
            chunk_counter += 1
            
    # Add chunks to collection (only if we have chunks)
    if documents:
        collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        
    # Retrieve top 3 relevant chunks using Hybrid Search and Reciprocal Rank Fusion (RRF)
    retrieved_chunks = []
    if chunk_counter > 0:
        # 1. Dense Semantic Search from ChromaDB (retrieve all candidate ranks)
        query_results = collection.query(
            query_texts=[query],
            n_results=chunk_counter
        )
        
        # 2. Sparse Keyword Search using BM25
        def tokenize(text: str) -> list[str]:
            clean = text.lower().translate(str.maketrans("", "", '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'))
            return clean.split()
            
        tokenized_corpus = [tokenize(doc) for doc in documents]
        bm25 = BM25Okapi(tokenized_corpus)
        
        tokenized_query = tokenize(query)
        bm25_scores = bm25.get_scores(tokenized_query)
        
        # Rank the corpus index by BM25 score in descending order
        sparse_ranking = sorted(range(len(documents)), key=lambda k: bm25_scores[k], reverse=True)
        
        # 3. Reciprocal Rank Fusion (RRF)
        # Constant parameter k = 60
        RRF_K = 60
        rrf_scores = {}
        
        for i in range(len(documents)):
            # Find rank in dense search
            dense_id = ids[i]
            try:
                rank_dense = query_results["ids"][0].index(dense_id)
            except (ValueError, KeyError, TypeError):
                # Fallback to lowest possible rank if not found
                rank_dense = chunk_counter
                
            # Find rank in sparse search
            rank_sparse = sparse_ranking.index(i)
            
            # Combine rank reciprocal scores
            score = (1.0 / (rank_dense + RRF_K)) + (1.0 / (rank_sparse + RRF_K))
            rrf_scores[i] = score
            
        # Get top 3 indices sorted by RRF score
        best_indices = sorted(range(len(documents)), key=lambda k: rrf_scores[k], reverse=True)
        
        # Format the top 3 RRF-selected chunks
        for idx in best_indices[:3]:
            doc = documents[idx]
            meta = metadatas[idx]
            source_title = meta.get("title", "Unknown Source")
            source_url = meta.get("url", "")
            formatted = f"Source: {source_title} ({source_url})\nContent: {doc}"
            retrieved_chunks.append(formatted)
                
    # Clean up session-specific collection
    try:
        client.delete_collection(collection_name)
    except Exception:
        pass

    return {
        "retrieved_chunks": retrieved_chunks,
        "current_agent": "rag"
    }
