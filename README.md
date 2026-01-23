# File Converter - Next.js Application

A Next.js application for converting PDF files to DOCX format using a Python microservice.

## Architecture Overview

This application uses a **microservices architecture** where:

- **Next.js** (Node.js) handles the web interface and API routing
- **Python FastAPI service** handles PDF to DOCX conversion using `pdf2docx`
- Services communicate via **HTTP only** - no shared runtime or dependencies

### Why LibreOffice was Removed

LibreOffice was previously used for document conversion, but has been completely removed because:
- **Dependency Issues**: LibreOffice is a large desktop application not designed for server use
- **Runtime Isolation**: Running LibreOffice alongside Node.js creates mixed runtime environments
- **Resource Overhead**: LibreOffice requires significant system resources and dependencies
- **Scalability**: Spawning external processes is less scalable than HTTP-based services
- **Maintenance**: Separate microservices are easier to maintain and deploy independently

### Why Python pdf2docx is Used

The Python `pdf2docx` library provides:
- **Pure Python Implementation**: No external binary dependencies
- **Lightweight**: Much smaller footprint than LibreOffice
- **Focused Purpose**: Specifically designed for PDF to DOCX conversion
- **Reliability**: Well-maintained library with good error handling
- **Performance**: Efficient conversion process optimized for this specific task

### How Next.js Communicates with Python Service

Communication is **HTTP-based only**:

1. User uploads PDF file through Next.js frontend
2. Next.js API route (`/api/convert`) receives the file
3. Next.js sends HTTP POST request to Python service (`http://localhost:8000/convert`)
4. Python service converts PDF to DOCX using `pdf2docx`
5. Python service returns DOCX file via HTTP response
6. Next.js streams the converted file back to the user

**No shared filesystem, no process spawning, no mixed runtimes** - clean HTTP-only communication.

## Project Structure

```
/
├── pages/                    # Next.js pages and API routes
│   ├── api/
│   │   └── convert.js       # API route (calls Python service via HTTP)
│   └── index.js             # Frontend page
├── components/               # React components
├── python-converter/         # Python microservice
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Python service container
│   └── README.md            # Python service documentation
├── docker-compose.yml       # Orchestrates both services
└── README.md                # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- Python 3.11+
- npm or pnpm

### Option 1: Run Services Separately (Development)

#### Start Python Service

```bash
cd python-converter
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Python service runs on `http://localhost:8000`

#### Start Next.js Application

```bash
npm install
npm run dev
```

Next.js runs on `http://localhost:3000`

Set environment variable if Python service is on different URL:
```bash
PYTHON_CONVERTER_URL=http://localhost:8000 npm run dev
```

### Option 2: Run with Docker Compose (Production-Ready)

```bash
docker-compose up
```

This starts both services in isolated containers:
- Next.js: `http://localhost:3000`
- Python service: `http://localhost:8000`

## API Endpoints

### Next.js API

- **POST** `/api/convert`
  - Accepts: `multipart/form-data` with `file` (PDF) and `format` (must be "docx")
  - Returns: DOCX file for download

### Python Service API

- **GET** `/` - Health check
- **POST** `/convert` - Convert PDF to DOCX
  - Accepts: `multipart/form-data` with `file` (PDF)
  - Returns: DOCX file

See `python-converter/README.md` for detailed Python service documentation.

## Environment Variables

- `PYTHON_CONVERTER_URL`: URL of Python conversion service (default: `http://localhost:8000`)
- `PORT`: Port for Python service (default: `8000`)

## Supported Conversions

Currently supported:
- **PDF → DOCX** (via Python `pdf2docx` service)

Other format conversions that previously relied on LibreOffice have been removed for architectural cleanliness. Additional conversions can be added as separate microservices following the same pattern.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Production Deployment

1. **Docker Compose** (Recommended): Use `docker-compose.yml` for isolated services
2. **Separate Deployment**: Deploy Next.js and Python service separately, connecting via HTTP
3. **Ensure Python service is accessible** from Next.js API routes (consider network configuration, firewall rules, etc.)

## License

This project uses [Next.js](https://nextjs.org) and is open source.
