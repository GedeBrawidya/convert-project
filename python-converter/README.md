# PDF to DOCX Conversion Service

Python microservice for converting PDF files to DOCX format using `pdf2docx`.

## Overview

This service provides a REST API endpoint for converting PDF files to DOCX format. It's designed to run as a separate microservice, communicating with the Next.js application via HTTP.

## Installation

1. Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Service

### Development Mode

```bash
python main.py
```

The service will start on `http://localhost:8000` by default.

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### With Custom Port

Set the `PORT` environment variable:
```bash
PORT=8080 python main.py
```

## API Endpoints

### Health Check
- **GET** `/`
- Returns service status

### Convert PDF to DOCX
- **POST** `/convert`
- **Body**: `multipart/form-data` with `file` field containing a PDF file
- **Returns**: DOCX file as binary download

### Example Request

```bash
curl -X POST "http://localhost:8000/convert" \
  -F "file=@document.pdf" \
  -o output.docx
```

## Configuration

- `TMP_DIR`: Directory for temporary file storage (default: `./tmp`)
- `PORT`: Server port (default: `8000`)

## Error Handling

The service returns appropriate HTTP status codes:
- `400`: Invalid file format or malformed request
- `500`: Conversion error or internal server error

## Dependencies

- **FastAPI**: Modern web framework for building APIs
- **uvicorn**: ASGI server for FastAPI
- **python-multipart**: Required for file uploads
- **pdf2docx**: Library for PDF to DOCX conversion




