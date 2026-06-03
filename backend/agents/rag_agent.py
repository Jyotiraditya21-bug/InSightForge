import os
import chromadb
from chromadb.utils import embedding_functions
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
        
    # Retrieve top 3 relevant chunks
    # Default to 3, but if total chunks is less than 3, adjust n_results
    n_results = min(3, chunk_counter) if chunk_counter > 0 else 1
    
    retrieved_chunks = []
    if chunk_counter > 0:
        query_results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        if query_results and "documents" in query_results and query_results["documents"]:
            docs = query_results["documents"][0]
            metas = query_results["metadatas"][0] if "metadatas" in query_results else []
            for idx, doc in enumerate(docs):
                meta = metas[idx] if idx < len(metas) else {}
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
