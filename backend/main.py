import os
import logging
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
    title="Multi-Agent Research Assistant API",
    description="FastAPI Backend for streaming multi-agent research workflow results.",
    version="1.0.0"
)

# CORS setup
# Allow React Vite local server and other hosts. Since credentials (cookies) are not used,
# allow_credentials=False works fine with wildcard origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResearchRequest(BaseModel):
    query: str

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/research")
async def research(request: ResearchRequest):
    logger.info(f"Received research request for query: {request.query}")
    
    async def event_generator():
        try:
            # Yield a 1024-byte padding comment to flush browser buffers (Safari/Chrome)
            yield {
                "comment": " " * 1024
            }
            # Execute compiled StateGraph via astream_events
            async for event in graph.astream_events({"query": request.query}, version="v2"):
                event_type = event.get("event")
                name = event.get("name")
                
                # Yield Status Updates: search -> rag -> writer
                if event_type == "on_chain_start" and name in ["search", "rag", "writer"]:
                    logger.info(f"Agent running: {name}")
                    yield {
                        "event": "status",
                        "data": name
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
