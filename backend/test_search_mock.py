import os
import sys
import unittest
from unittest.mock import patch, MagicMock

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.search_agent import search_agent

class TestSearchAgentMock(unittest.TestCase):
    @patch('requests.post')
    @patch.dict(os.environ, {"TAVILY_API_KEY": "mock_tavily_key"})
    def test_search_agent_success(self, mock_post):
        # Setup mock response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "results": [
                {
                    "title": "Llama 3 Release",
                    "url": "https://meta.com/llama3",
                    "content": "Meta releases Llama 3 with 8B and 70B parameter models."
                }
            ]
        }
        mock_post.return_value = mock_response
        
        test_state = {
            "query": "Llama 3 models",
            "search_results": [],
            "retrieved_chunks": [],
            "report": "",
            "current_agent": ""
        }
        
        result = search_agent(test_state)
        
        self.assertEqual(result["current_agent"], "search")
        self.assertEqual(len(result["search_results"]), 1)
        self.assertIn("Meta releases Llama 3", result["search_results"][0])
        self.assertIn("URL: https://meta.com/llama3", result["search_results"][0])
        print("Mock test passed successfully!")

if __name__ == "__main__":
    unittest.main()
