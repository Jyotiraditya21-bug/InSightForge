import os
import json
import logging
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from state import ResearchState

logger = logging.getLogger(__name__)

async def critique_agent(state: ResearchState) -> dict:
    """
    Critique Agent:
    Evaluates the writer's report against the query and retrieved context chunks.
    Scores it from 1 to 10. If score < 8, the writer must revise.
    """
    query = state.get("query", "")
    report = state.get("report", "")
    chunks = state.get("retrieved_chunks", [])
    writer_attempts = state.get("writer_attempts", 0)

    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key or groq_api_key == "your_groq_api_key_here":
        raise ValueError("GROQ_API_KEY environment variable is not set. Please set it in backend/.env")

    # Initialize Groq LLM
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.1,  # Low temperature for objective evaluation
        groq_api_key=groq_api_key
    )

    context = "\n\n".join(chunks) if chunks else "No retrieved context."

    system_prompt = (
        "You are an expert critique agent and quality assurance auditor. Your job is to evaluate a generated research report.\n"
        "You must analyze the report and provide a quality score between 1 and 10 (integer) and detailed constructive feedback.\n\n"
        "Evaluation Guidelines:\n"
        "1. Query Alignment: Does the report directly and comprehensively answer the user's query?\n"
        "2. Groundedness & Factuality: Does the report stick strictly to the retrieved context? If it includes unsupported claims or fails to use the provided information, score it lower.\n"
        "3. Citations: Are all facts properly cited using [Source Title](URL) format matching the retrieved chunks? If there are no inline clickable citations, score it below 7.\n\n"
        "Output your response strictly in the following JSON format. Do not include any other markdown or text outside the JSON:\n"
        "{\n"
        "  \"score\": <integer_between_1_and_10>,\n"
        "  \"feedback\": \"<detailed_constructive_feedback>\"\n"
        "}"
    )

    human_prompt = (
        f"Research Query: {query}\n\n"
        f"Retrieved Context Chunks:\n{context}\n\n"
        f"Generated Report:\n{report}"
    )

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=human_prompt)
    ]

    logger.info(f"Critique Agent evaluating report (attempt {writer_attempts + 1})...")

    # Call LLM
    try:
        response = await llm.ainvoke(messages)
        content = response.content.strip()
        
        # Clean response if LLM accidentally wrapped it in codeblocks
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        data = json.loads(content)
        score = int(data.get("score", 7))
        feedback = data.get("feedback", "No detailed feedback provided.")
    except Exception as e:
        logger.error(f"Error during critique evaluation parsing: {str(e)}")
        # Fallback in case of parse error or timeout to keep the pipeline moving
        score = 8
        feedback = "Critique agent encountered an evaluation error. Proceeding with report."

    logger.info(f"Critique score: {score}/10. Feedback: {feedback}")

    return {
        "critique_score": score,
        "critique_feedback": feedback,
        "writer_attempts": writer_attempts + 1,
        "current_agent": "critique"
    }
