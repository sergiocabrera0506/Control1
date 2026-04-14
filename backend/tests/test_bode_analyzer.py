"""
Backend API tests for Bode Diagram Analyzer
Tests: /api/ health, /api/analyze, /api/export/csv, /api/export/pdf, /api/time-response, /api/transfers CRUD
"""
import pytest
import requests
import os
import base64
from pathlib import Path

# Load EXPO_PUBLIC_BACKEND_URL from frontend .env
frontend_env = Path('/app/frontend/.env')
if frontend_env.exists():
    with open(frontend_env) as f:
        for line in f:
            if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
                break
else:
    raise RuntimeError("Frontend .env not found")

class TestHealthCheck:
    """Health check endpoint"""
    
    def test_api_root(self):
        """Test GET /api/ returns success"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Health check passed: {data}")


class TestAnalyzeEndpoint:
    """POST /api/analyze - Transfer function analysis"""
    
    def test_analyze_default_transfer_function(self):
        """Test analysis with default transfer function G(s) = (s + 1.2) / (s² + 0.45s + 1)"""
        payload = {
            "numerator": [0, 0, 1, 1.2],
            "denominator": [0, 0, 1, 0.45, 1],
            "freq_min": 0.01,
            "freq_max": 100000.0,
            "num_points": 1024
        }
        response = requests.post(f"{BASE_URL}/api/analyze", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        # Verify all required fields are present
        assert "frequencies" in data
        assert "magnitude_db" in data
        assert "phase_deg" in data
        assert "poles" in data
        assert "zeros" in data
        assert "is_stable" in data
        assert "gain_margin_db" in data
        assert "phase_margin_deg" in data
        assert "order" in data
        
        # Verify data types and lengths
        assert isinstance(data["frequencies"], list)
        assert isinstance(data["magnitude_db"], list)
        assert isinstance(data["phase_deg"], list)
        assert len(data["frequencies"]) == len(data["magnitude_db"])
        assert len(data["frequencies"]) == len(data["phase_deg"])
        assert len(data["frequencies"]) > 0
        
        # Verify poles and zeros structure
        assert isinstance(data["poles"], list)
        assert isinstance(data["zeros"], list)
        if len(data["poles"]) > 0:
            assert "real" in data["poles"][0]
            assert "imag" in data["poles"][0]
        if len(data["zeros"]) > 0:
            assert "real" in data["zeros"][0]
            assert "imag" in data["zeros"][0]
        
        # Verify stability flag
        assert isinstance(data["is_stable"], bool)
        
        # Verify order
        assert isinstance(data["order"], int)
        assert data["order"] == 2  # denominator is 2nd order
        
        print(f"✓ Analyze endpoint passed")
        print(f"  - Frequencies: {len(data['frequencies'])} points")
        print(f"  - Poles: {len(data['poles'])}, Zeros: {len(data['zeros'])}")
        print(f"  - Stable: {data['is_stable']}")
        print(f"  - Gain margin: {data['gain_margin_db']} dB")
        print(f"  - Phase margin: {data['phase_margin_deg']} deg")
    
    def test_analyze_first_order_system(self):
        """Test analysis with 1st order system G(s) = 1 / (s + 1)"""
        payload = {
            "numerator": [0, 0, 0, 1],
            "denominator": [0, 0, 0, 1, 1],
            "freq_min": 0.01,
            "freq_max": 100.0,
            "num_points": 512
        }
        response = requests.post(f"{BASE_URL}/api/analyze", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["order"] == 1
        assert len(data["frequencies"]) == 512
        print(f"✓ First order system analysis passed")
    
    def test_analyze_invalid_all_zeros(self):
        """Test analysis with all zero coefficients returns error"""
        payload = {
            "numerator": [0, 0, 0, 0],
            "denominator": [0, 0, 0, 0, 0],
            "freq_min": 0.01,
            "freq_max": 100.0,
            "num_points": 512
        }
        response = requests.post(f"{BASE_URL}/api/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "error" in data
        print(f"✓ Invalid transfer function error handling passed")


class TestExportCSV:
    """POST /api/export/csv - CSV export"""
    
    def test_export_csv_returns_base64(self):
        """Test CSV export returns base64 encoded data"""
        payload = {
            "numerator": [0, 0, 1, 1.2],
            "denominator": [0, 0, 1, 0.45, 1],
            "freq_min": 0.01,
            "freq_max": 100000.0,
            "num_points": 1024
        }
        response = requests.post(f"{BASE_URL}/api/export/csv", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "csv_base64" in data
        assert "filename" in data
        assert data["filename"] == "bode_analysis.csv"
        
        # Verify base64 can be decoded
        csv_content = base64.b64decode(data["csv_base64"]).decode('utf-8')
        assert "Frequency_Hz" in csv_content
        assert "Magnitude_dB" in csv_content
        assert "Phase_deg" in csv_content
        
        # Verify CSV has data rows
        lines = csv_content.strip().split('\n')
        assert len(lines) > 1  # Header + data rows
        
        print(f"✓ CSV export passed")
        print(f"  - Filename: {data['filename']}")
        print(f"  - CSV lines: {len(lines)}")
    
    def test_export_csv_invalid_transfer_function(self):
        """Test CSV export with invalid transfer function"""
        payload = {
            "numerator": [0, 0, 0, 0],
            "denominator": [0, 0, 0, 0, 0],
            "freq_min": 0.01,
            "freq_max": 100.0,
            "num_points": 512
        }
        response = requests.post(f"{BASE_URL}/api/export/csv", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "error" in data
        print(f"✓ CSV export error handling passed")


class TestExportPDF:
    """POST /api/export/pdf - PDF export"""
    
    def test_export_pdf_returns_base64(self):
        """Test PDF export returns base64 encoded data"""
        payload = {
            "numerator": [0, 0, 1, 1.2],
            "denominator": [0, 0, 1, 0.45, 1],
            "freq_min": 0.01,
            "freq_max": 100000.0,
            "num_points": 1024
        }
        response = requests.post(f"{BASE_URL}/api/export/pdf", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "pdf_base64" in data
        assert "filename" in data
        assert data["filename"] == "bode_report.pdf"
        
        # Verify base64 can be decoded
        pdf_content = base64.b64decode(data["pdf_base64"])
        # PDF files start with %PDF
        assert pdf_content[:4] == b'%PDF'
        
        print(f"✓ PDF export passed")
        print(f"  - Filename: {data['filename']}")
        print(f"  - PDF size: {len(pdf_content)} bytes")
    
    def test_export_pdf_invalid_transfer_function(self):
        """Test PDF export with invalid transfer function"""
        payload = {
            "numerator": [0, 0, 0, 0],
            "denominator": [0, 0, 0, 0, 0],
            "freq_min": 0.01,
            "freq_max": 100.0,
            "num_points": 512
        }
        response = requests.post(f"{BASE_URL}/api/export/pdf", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "error" in data
        print(f"✓ PDF export error handling passed")



class TestTimeResponse:
    """POST /api/time-response - Step and impulse response analysis"""
    
    def test_time_response_default_tf(self):
        """Test time-response with default transfer function"""
        payload = {
            "numerator": [0, 0, 1, 1.2],
            "denominator": [0, 0, 1, 0.45, 1],
            "freq_min": 0.01,
            "freq_max": 100000.0,
            "num_points": 1024
        }
        response = requests.post(f"{BASE_URL}/api/time-response", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        # Verify structure
        assert "step" in data
        assert "impulse" in data
        assert "metrics" in data
        
        # Verify step response
        assert "time" in data["step"]
        assert "amplitude" in data["step"]
        assert isinstance(data["step"]["time"], list)
        assert isinstance(data["step"]["amplitude"], list)
        assert len(data["step"]["time"]) > 0
        assert len(data["step"]["time"]) == len(data["step"]["amplitude"])
        
        # Verify impulse response
        assert "time" in data["impulse"]
        assert "amplitude" in data["impulse"]
        assert isinstance(data["impulse"]["time"], list)
        assert isinstance(data["impulse"]["amplitude"], list)
        assert len(data["impulse"]["time"]) > 0
        
        # Verify metrics
        assert "steady_state" in data["metrics"]
        assert "overshoot_pct" in data["metrics"]
        assert "rise_time" in data["metrics"]
        assert "settling_time" in data["metrics"]
        
        # Verify metric types
        assert isinstance(data["metrics"]["steady_state"], (int, float))
        assert isinstance(data["metrics"]["overshoot_pct"], (int, float))
        # rise_time and settling_time can be None
        
        print(f"✓ Time-response endpoint passed")
        print(f"  - Step time points: {len(data['step']['time'])}")
        print(f"  - Impulse time points: {len(data['impulse']['time'])}")
        print(f"  - Steady state: {data['metrics']['steady_state']}")
        print(f"  - Overshoot: {data['metrics']['overshoot_pct']}%")
        print(f"  - Rise time: {data['metrics']['rise_time']}")
        print(f"  - Settling time: {data['metrics']['settling_time']}")
    
    def test_time_response_invalid_tf(self):
        """Test time-response with invalid transfer function"""
        payload = {
            "numerator": [0, 0, 0, 0],
            "denominator": [0, 0, 0, 0, 0],
            "freq_min": 0.01,
            "freq_max": 100.0,
            "num_points": 512
        }
        response = requests.post(f"{BASE_URL}/api/time-response", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "error" in data
        print(f"✓ Time-response error handling passed")


class TestTransfersCRUD:
    """CRUD operations for saved transfer functions"""
    
    def test_save_and_list_transfer(self):
        """Test saving a transfer function and listing it"""
        # Save a new transfer function
        save_payload = {
            "name": "TEST_Low_Pass_Filter",
            "numerator": [0, 0, 0, 1],
            "denominator": [0, 0, 0, 1, 1]
        }
        save_response = requests.post(f"{BASE_URL}/api/transfers", json=save_payload)
        assert save_response.status_code == 200
        
        saved_data = save_response.json()
        assert "id" in saved_data
        assert "name" in saved_data
        assert "numerator" in saved_data
        assert "denominator" in saved_data
        assert "created_at" in saved_data
        assert saved_data["name"] == "TEST_Low_Pass_Filter"
        assert saved_data["numerator"] == [0, 0, 0, 1]
        assert saved_data["denominator"] == [0, 0, 0, 1, 1]
        
        saved_id = saved_data["id"]
        print(f"✓ Save transfer function passed - ID: {saved_id}")
        
        # List all transfers and verify the saved one is present
        list_response = requests.get(f"{BASE_URL}/api/transfers")
        assert list_response.status_code == 200
        
        transfers = list_response.json()
        assert isinstance(transfers, list)
        
        # Find our saved transfer
        found = False
        for tf in transfers:
            if tf["id"] == saved_id:
                found = True
                assert tf["name"] == "TEST_Low_Pass_Filter"
                assert tf["numerator"] == [0, 0, 0, 1]
                assert tf["denominator"] == [0, 0, 0, 1, 1]
                break
        
        assert found, "Saved transfer function not found in list"
        print(f"✓ List transfers passed - Total transfers: {len(transfers)}")
        
        # Cleanup: delete the test transfer
        delete_response = requests.delete(f"{BASE_URL}/api/transfers/{saved_id}")
        assert delete_response.status_code == 200
        delete_data = delete_response.json()
        assert delete_data["status"] == "deleted"
        print(f"✓ Delete transfer function passed")
        
        # Verify it's deleted by listing again
        verify_response = requests.get(f"{BASE_URL}/api/transfers")
        verify_transfers = verify_response.json()
        for tf in verify_transfers:
            assert tf["id"] != saved_id, "Transfer function still exists after deletion"
        print(f"✓ Verified deletion - Transfer removed from list")
    
    def test_delete_nonexistent_transfer(self):
        """Test deleting a non-existent transfer function"""
        fake_id = "nonexistent-id-12345"
        response = requests.delete(f"{BASE_URL}/api/transfers/{fake_id}")
        assert response.status_code == 200
        data = response.json()
        assert "error" in data
        print(f"✓ Delete non-existent transfer error handling passed")

