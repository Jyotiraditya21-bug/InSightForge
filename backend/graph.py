from langgraph.graph import StateGraph, END
from state import ResearchState
from agents.search_agent import search_agent
from agents.rag_agent import rag_agent
from agents.writer_agent import writer_agent

# Initialize the StateGraph workflow with our State schema
workflow = StateGraph(ResearchState)

# Add the agent nodes
workflow.add_node("search", search_agent)
workflow.add_node("rag", rag_agent)
workflow.add_node("writer", writer_agent)

# Set the entry point of the workflow to the Search Agent
workflow.set_entry_point("search")

# Define the transition flow: search -> rag -> writer -> END
workflow.add_edge("search", "rag")
workflow.add_edge("rag", "writer")
workflow.add_edge("writer", END)

# Compile the workflow graph
graph = workflow.compile()
