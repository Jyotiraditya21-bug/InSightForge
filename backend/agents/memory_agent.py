import os
import uuid
import logging
import chromadb
from chromadb.utils import embedding_functions
from state import ResearchState

logger = logging.getLogger(__name__)

def get_chroma_client():
    # Use './chroma_db' relative to backend execution directory
    return chromadb.PersistentClient(path="./chroma_db")

def get_embedding_function():
    return embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )

def memory_retrieve(state: ResearchState) -> dict:
    """
    Memory Agent Retrieval:
    Queries the persistent 'agent_memory' collection for past reports/queries
    similar to the current query. Injects findings into past_memories.
    """
    query = state.get("query", "")
    if not query:
        return {"past_memories": [], "current_agent": "memory_retrieve"}

    logger.info(f"Memory Agent checking past memories for query: {query}")
    client = get_chroma_client()
    emb_fn = get_embedding_function()

    collection_name = "agent_memory"
    past_memories = []

    try:
        # Get or create the persistent memory collection
        collection = client.get_or_create_collection(
            name=collection_name,
            embedding_function=emb_fn
        )
        
        # Check if collection is empty
        if collection.count() > 0:
            query_results = collection.query(
                query_texts=[query],
                n_results=2
            )
            
            if query_results and "documents" in query_results and query_results["documents"]:
                docs = query_results["documents"][0]
                metas = query_results["metadatas"][0] if "metadatas" in query_results else []
                
                for idx, doc in enumerate(docs):
                    meta = metas[idx] if idx < len(metas) else {}
                    past_query = meta.get("query", "Unknown Query")
                    # Format past context
                    formatted = f"Past Query: {past_query}\nPast Report Summary/Details:\n{doc}"
                    past_memories.append(formatted)
                    logger.info(f"Memory Agent retrieved relevant past query: '{past_query}'")
    except Exception as e:
        logger.error(f"Error retrieving from persistent memory: {str(e)}")

    return {
        "past_memories": past_memories,
        "current_agent": "memory_retrieve"
    }

def memory_store(state: ResearchState) -> dict:
    """
    Memory Agent Storage:
    Stores the final report and original query into the persistent 'agent_memory' collection.
    """
    query = state.get("query", "")
    report = state.get("report", "")
    
    if not query or not report:
        logger.warning("Memory Agent: Missing query or report. Skipping storage.")
        return {"current_agent": "memory_store"}

    logger.info(f"Memory Agent storing current research query: '{query}'")
    client = get_chroma_client()
    emb_fn = get_embedding_function()

    collection_name = "agent_memory"

    try:
        collection = client.get_or_create_collection(
            name=collection_name,
            embedding_function=emb_fn
        )
        
        # We store the first 1500 characters or a clean summary of the report to keep the embedding focus high
        # alongside the full report content if desired. Let's store the first 2000 characters as the document,
        # with full report as metadata if needed, or simply store the report itself.
        # Storing the first 3000 chars is usually perfect for RAG context matching.
        snippet = report[:4000]
        
        doc_id = f"mem_{uuid.uuid4().hex}"
        collection.add(
            documents=[snippet],
            metadatas=[{"query": query, "full_report_len": len(report)}],
            ids=[doc_id]
        )
        logger.info(f"Memory Agent successfully saved record with id {doc_id}")
    except Exception as e:
        logger.error(f"Error saving to persistent memory: {str(e)}")

    return {
        "current_agent": "memory_store"
    }
