import os
import sys
import asyncio
from dotenv import load_dotenv

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from agents.writer_agent import writer_agent

async def main():
    test_chunks = [
        "Source: LangGraph Docs (https://langchain-ai.github.io/langgraph/)\nContent: LangGraph is built for multi-agent workflows. It coordinates tasks using graphs consisting of nodes and edges.",
        "Source: Groq Speed Test (https://groq.com/speed)\nContent: Groq LPU technology allows Llama models to run at over 200 tokens per second, enabling real-time streaming."
    ]
    
    test_state = {
        "query": "LangGraph multi-agent capabilities and Groq speed.",
        "search_results": [],
        "retrieved_chunks": test_chunks,
        "report": "",
        "current_agent": ""
    }
    
    print("Testing Writer Agent with query:", test_state["query"])
    try:
        res = await writer_agent(test_state)
        print("Success! Agent returned updates:")
        print("Current Agent:", res.get("current_agent"))
        print("\nGenerated Report:\n")
        print(res.get("report"))
    except Exception as e:
        print("Error encountered:", str(e))

if __name__ == "__main__":
    asyncio.run(main())
