"""
Backend API tests for Bode Diagram Analyzer
Tests: /api/ health, /api/analyze, /api/export/csv, /api/export/pdf
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
