import os
import sys
import unittest
import asyncio
from unittest.mock import patch, MagicMock

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.writer_agent import writer_agent

class TestWriterAgentMock(unittest.TestCase):
    @patch('agents.writer_agent.ChatGroq')
    @patch.dict(os.environ, {"GROQ_API_KEY": "mock_groq_key"})
    def test_writer_agent_success(self, mock_chat_groq):
        # Setup mock response
        mock_llm = MagicMock()
        
        # mock astream method which is an async generator
        async def mock_astream(*args, **kwargs):
            mock_chunk = MagicMock()
            mock_chunk.content = "# Mock Report\n\nThis is a mock research report citing [LangGraph Docs](https://langchain-ai.github.io/langgraph/)."
            yield mock_chunk
            
        mock_llm.astream = mock_astream
        mock_chat_groq.return_value = mock_llm
        
        test_state = {
            "query": "LangGraph multi-agent capabilities",
            "search_results": [],
            "retrieved_chunks": [
                "Source: LangGraph Docs (https://langchain-ai.github.io/langgraph/)\nContent: LangGraph is built for multi-agent workflows."
            ],
            "report": "",
            "current_agent": ""
        }
        
        # Run async function using asyncio
        result = asyncio.run(writer_agent(test_state))
        
        self.assertEqual(result["current_agent"], "writer")
        self.assertIn("# Mock Report", result["report"])
        self.assertIn("https://langchain-ai.github.io/langgraph/", result["report"])
        
        # Verify ChatGroq was instantiated with correct parameters
        mock_chat_groq.assert_called_once_with(
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            groq_api_key="mock_groq_key"
        )
        print("Writer agent async mock test passed successfully!")

if __name__ == "__main__":
    unittest.main()
