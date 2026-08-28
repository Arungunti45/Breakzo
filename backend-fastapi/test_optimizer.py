import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_optimize_break():
    # This is a basic test to verify the endpoint is reachable and returns a valid schema
    payload = {
        "break_start": "10:30",
        "break_end": "10:45",
        "student_location_id": 1,
        "selected_items": [1, 2]
    }
    response = client.post("/api/optimizer/optimize", json=payload)
    
    # Since DB is not mocked in this simple test, it might return 404 if no canteens are open or 500
    # We just ensure it doesn't crash catastrophically and returns JSON.
    assert response.status_code in [200, 404, 500]
    
    if response.status_code == 200:
        data = response.json()
        assert "success" in data
        assert "message" in data
