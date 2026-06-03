import os
import sys
from dotenv import load_dotenv

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from agents.search_agent import search_agent

if __name__ == "__main__":
    test_state = {
        "query": "What is the latest model version of llama 3?",
        "search_results": [],
        "retrieved_chunks": [],
        "report": "",
        "current_agent": ""
    }
    
    print("Testing Search Agent with query:", test_state["query"])
    try:
        res = search_agent(test_state)
        print("Success! Agent returned updates:")
        print("Current Agent:", res.get("current_agent"))
        print("Number of results:", len(res.get("search_results", [])))
        for i, doc in enumerate(res.get("search_results", []), start=1):
            print(f"\nResult {i}:")
            print(doc[:300] + "...")
    except Exception as e:
        print("Error encountered:", str(e))
