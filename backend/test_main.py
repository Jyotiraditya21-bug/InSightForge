import os
import sys
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import ResearchRequest, app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
    print("Health check endpoint test passed!")

def test_research_request_validation():
    req = ResearchRequest(query="  agentic rag  ", depth="advanced")
    assert req.query == "agentic rag"
    assert req.depth == "advanced"
    assert req.session_id is None

    with pytest.raises(ValidationError):
        ResearchRequest(query="   ")

    with pytest.raises(ValidationError):
        ResearchRequest(query="valid query", depth="invalid")

if __name__ == "__main__":
    test_health()
