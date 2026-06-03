from typing import TypedDict, List

class ResearchState(TypedDict):
    query: str
    depth: str
    session_id: str
    search_results: List[str]
    retrieved_chunks: List[str]
    past_memories: List[str]
    report: str
    current_agent: str
    critique_score: int
    critique_feedback: str
    writer_attempts: int

