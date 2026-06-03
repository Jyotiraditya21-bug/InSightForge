import os
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from state import ResearchState

async def writer_agent(state: ResearchState) -> dict:
    """
    Writer agent node: generates a structured markdown research report using Groq llama-3.3-70b-versatile.
    Runs asynchronously and uses astream for streaming support.
    """
    query = state.get("query", "")
    chunks = state.get("retrieved_chunks", [])
    
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key or groq_api_key == "your_groq_api_key_here":
        raise ValueError("GROQ_API_KEY environment variable is not set. Please set it in backend/.env")
        
    # Initialize Groq LLM
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        groq_api_key=groq_api_key
    )
    
    # Formulate context
    context = "\n\n".join(chunks) if chunks else "No relevant context found."
    
    system_prompt = (
        "You are an expert research assistant and writer. Your task is to write a comprehensive, "
        "detailed, and structured research report in markdown format based on the retrieved context.\n\n"
        "Follow these guidelines:\n"
        "1. Write clear, detailed, and insightful content under logical headings.\n"
        "2. Cite your sources inline using [Source Title](URL) notation based on the context.\n"
        "3. Include a short introduction summarizing the query and key findings, and a conclusion.\n"
        "4. Rely ONLY on the facts provided in the retrieved context. Do not invent information.\n"
        "5. Output ONLY the raw markdown report. Do not include any meta-commentary or conversational filler."
    )
    
    human_prompt = f"Research Query: {query}\n\nRetrieved Context:\n{context}"
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=human_prompt)
    ]
    
    # Stream the model response so it triggers stream events
    response_chunks = []
    async for chunk in llm.astream(messages):
        response_chunks.append(chunk.content)
        
    full_report = "".join(response_chunks)
    
    return {
        "report": full_report,
        "current_agent": "writer"
    }
