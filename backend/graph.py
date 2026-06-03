from langgraph.graph import StateGraph, END
from state import ResearchState
from agents.search_agent import search_agent
from agents.rag_agent import rag_agent
from agents.writer_agent import writer_agent
from agents.memory_agent import memory_retrieve, memory_store
from agents.critique_agent import critique_agent

# Initialize the StateGraph workflow with our State schema
workflow = StateGraph(ResearchState)

# Add the agent nodes
workflow.add_node("memory_retrieve", memory_retrieve)
workflow.add_node("search", search_agent)
workflow.add_node("rag", rag_agent)
workflow.add_node("writer", writer_agent)
workflow.add_node("critique", critique_agent)
workflow.add_node("memory_store", memory_store)

# Set the entry point of the workflow to the Memory Retrieve Agent
workflow.set_entry_point("memory_retrieve")

# Define transitions
workflow.add_edge("memory_retrieve", "search")
workflow.add_edge("search", "rag")
workflow.add_edge("rag", "writer")
workflow.add_edge("writer", "critique")

# Critique conditional routing
def route_after_critique(state: ResearchState) -> str:
    score = state.get("critique_score", 8)
    attempts = state.get("writer_attempts", 0)
    # If the score is high enough or we have hit max attempts (3), proceed to save and finish
    if score >= 8 or attempts >= 3:
        return "memory_store"
    # Otherwise, loop back to the writer for regeneration
    return "writer"

workflow.add_conditional_edges(
    "critique",
    route_after_critique,
    {
        "memory_store": "memory_store",
        "writer": "writer"
    }
)

workflow.add_edge("memory_store", END)

# Compile the workflow graph
graph = workflow.compile()
