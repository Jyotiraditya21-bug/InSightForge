import os
import logging
import uuid
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv

load_dotenv()

from graph import graph

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="InSightForge API",
    description="FastAPI Backend for streaming InSightForge multi-agent research workflow results.",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResearchRequest(BaseModel):
    query: str
    depth: str = "basic"
    session_id: str = None

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/research")
async def research(request: ResearchRequest):
    logger.info(f"Received research request for query: {request.query}, depth: {request.depth}, session_id: {request.session_id}")
    
    async def event_generator():
        try:
            # Yield a 1024-byte padding comment to flush browser buffers (Safari/Chrome)
            yield {
                "comment": " " * 1024
            }
            
            session_id = request.session_id or uuid.uuid4().hex
            
            initial_state = {
                "query": request.query,
                "depth": request.depth,
                "session_id": session_id,
                "writer_attempts": 0,
                "past_memories": [],
                "retrieved_chunks": [],
                "search_results": [],
                "report": "",
                "current_agent": ""
            }
            
            # Execute compiled StateGraph via astream_events
            async for event in graph.astream_events(initial_state, version="v2"):
                event_type = event.get("event")
                name = event.get("name")
                
                # Yield Status Updates: memory_retrieve -> search -> rag -> writer -> critique -> memory_store
                if event_type == "on_chain_start" and name in ["memory_retrieve", "search", "rag", "writer", "critique", "memory_store"]:
                    logger.info(f"Agent running: {name}")
                    yield {
                        "event": "status",
                        "data": name
                    }
                
                # Yield critique feedback details when the critique agent node ends
                elif event_type == "on_chain_end" and name == "critique":
                    output = event.get("data", {}).get("output", {})
                    if output:
                        score = output.get("critique_score", 8)
                        feedback = output.get("critique_feedback", "")
                        attempts = output.get("writer_attempts", 1)
                        yield {
                            "event": "critique_log",
                            "data": json.dumps({
                                "score": score,
                                "feedback": feedback,
                                "attempts": attempts
                            })
                        }
                
                # Yield word by word/token stream updates from ChatGroq LLM
                elif event_type == "on_chat_model_stream":
                    chunk = event.get("data", {}).get("chunk")
                    if chunk and hasattr(chunk, "content") and chunk.content:
                        # Stream the chunk text
                        yield {
                            "event": "chunk",
                            "data": chunk.content
                        }
            
            # Stream done completion event
            yield {
                "event": "done",
                "data": "complete"
            }
            logger.info("Research stream completed successfully.")
            
        except Exception as e:
            logger.error(f"Error in research stream: {str(e)}")
            yield {
                "event": "error",
                "data": str(e)
            }
            
    return EventSourceResponse(event_generator())

