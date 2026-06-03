import os
import sys
from dotenv import load_dotenv

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from agents.rag_agent import rag_agent

if __name__ == "__main__":
    # Mock search results for testing
    mock_search_results = [
        "Title: LangGraph Documentation\nURL: https://langchain-ai.github.io/langgraph/\nContent: LangGraph is a library for building stateful, multi-actor applications with LLMs. It extends LangChain Expression Language (LCEL) with the ability to coordinate multiple chains (or actors) across multiple steps of computation in a cyclic manner. It is inspired by Pregel and Apache Pregel. LangGraph is a powerful tool for agentic workflows.",
        "Title: ChromaDB Overview\nURL: https://docs.trychroma.com/\nContent: ChromaDB is the AI-native open-source vector database. Chroma makes it easy to build LLM apps by making knowledge, facts, and skills pluggable for LLMs. It provides a simple API, embedding function support, and fast querying. You can run Chroma in-memory or persisted to disk."
    ]
    
    test_state = {
        "query": "What is LangGraph and how does it extend LCEL?",
        "search_results": mock_search_results,
        "retrieved_chunks": [],
        "report": "",
        "current_agent": ""
    }
    
    print("Testing RAG Agent with query:", test_state["query"])
    try:
        res = rag_agent(test_state)
        print("Success! Agent returned updates:")
        print("Current Agent:", res.get("current_agent"))
        print("Number of retrieved chunks:", len(res.get("retrieved_chunks", [])))
        for i, chunk in enumerate(res.get("retrieved_chunks", []), start=1):
            print(f"\nRetrieved Chunk {i}:")
            print(chunk)
    except Exception as e:
        print("Error encountered:", str(e))
