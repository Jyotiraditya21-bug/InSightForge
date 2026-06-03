from typing import TypedDict, List

class ResearchState(TypedDict):
    query: str
    search_results: List[str]
    retrieved_chunks: List[str]
    report: str
    current_agent: str
