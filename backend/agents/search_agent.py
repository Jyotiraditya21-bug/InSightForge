import os
import requests
from state import ResearchState

def search_agent(state: ResearchState) -> dict:
    """
    Search agent node: fetches top 5 results from Tavily API for the query.
    """
    query = state.get("query", "")
    if not query:
        raise ValueError("Search query cannot be empty.")
        
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key or tavily_api_key == "your_tavily_api_key_here":
        raise ValueError("TAVILY_API_KEY environment variable is not set. Please set it in backend/.env")
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "api_key": tavily_api_key,
        "query": query,
        "search_depth": "basic",
        "max_results": 5
    }
    
    response = requests.post("https://api.tavily.com/search", json=payload, headers=headers)
    response.raise_for_status()
    
    results = response.json().get("results", [])
    
    search_results = []
    for res in results:
        title = res.get("title", "Untitled")
        url = res.get("url", "")
        content = res.get("content", "")
        search_results.append(f"Title: {title}\nURL: {url}\nContent: {content}")
        
    return {
        "search_results": search_results,
        "current_agent": "search"
    }
