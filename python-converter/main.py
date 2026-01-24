"""
PDF to DOCX Conversion Service using LibreOffice
FastAPI microservice for converting PDF files to DOCX format
"""
import os
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse

app = FastAPI(
    title="PDF to DOCX Converter",
    description="Microservice for converting PDF files to DOCX format using LibreOffice",
    version="1.0.0"
)

# Temporary directory for file processing
TMP_DIR = os.getenv("TMP_DIR", os.path.join(os.getcwd(), "tmp"))
os.makedirs(TMP_DIR, exist_ok=True)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "pdf-to-docx-converter", "engine": "LibreOffice"}


@app.post("/convert")
async def convert_pdf_to_docx(file: UploadFile = File(...)):
    """
    Convert PDF file to DOCX format using LibreOffice headless
    
    Args:
        file: PDF file to convert
        
    Returns:
        DOCX file as binary download
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext != ".pdf":
        raise HTTPException(
            status_code=400,
            detail=f"Only PDF files are supported. Received: {file_ext}"
        )
    
    # Generate unique temporary file names
    input_id = str(uuid.uuid4())
    input_pdf = os.path.join(TMP_DIR, f"{input_id}.pdf")
    output_docx = os.path.join(TMP_DIR, f"{input_id}.docx")
    
    try:
        # Save uploaded PDF to temporary file
        with open(input_pdf, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Convert PDF to DOCX using LibreOffice headless
        # LibreOffice command: libreoffice --headless --convert-to docx --outdir <dir> <file>
        args = [
            "libreoffice",
            "--headless",
            "--convert-to",
            "docx",
            "--outdir",
            TMP_DIR,
            input_pdf,
        ]
        
        process = subprocess.run(
            args,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=300,  # 5 minute timeout
        )
        
        if process.returncode != 0:
            stderr = process.stderr.decode('utf-8', errors='ignore')
            raise HTTPException(
                status_code=500,
                detail=f"LibreOffice conversion failed: {stderr}"
            )
        
        # LibreOffice outputs file with same basename but different extension
        # Expected: {input_id}.pdf -> {input_id}.docx
        # But LibreOffice might create: {input_id}.docx
        
        # Check if output file exists
        if not os.path.exists(output_docx):
            # Try alternative naming pattern
            input_basename = Path(input_pdf).stem
            alternative_output = os.path.join(TMP_DIR, f"{input_basename}.docx")
            if os.path.exists(alternative_output):
                output_docx = alternative_output
            else:
                # List files in tmp dir for debugging
                tmp_files = os.listdir(TMP_DIR)
                raise HTTPException(
                    status_code=500,
                    detail=f"Conversion output not found. Files in tmp: {tmp_files[-5:]}"
                )
        
        # Return the converted file
        output_filename = Path(file.filename).stem + ".docx"
        return FileResponse(
            output_docx,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=output_filename,
            background=None  # Delete file after sending
        )
    
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=504,
            detail="Conversion timeout: LibreOffice took too long to process the file"
        )
    except HTTPException:
        raise
    except Exception as e:
        error_message = str(e)
        if "PDF" in error_message or "pdf" in error_message or "LibreOffice" in error_message:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid PDF file or conversion error: {error_message}"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Conversion failed: {error_message}"
            )
    
    finally:
        # Clean up input file after processing
        if os.path.exists(input_pdf):
            try:
                os.remove(input_pdf)
            except:
                pass


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
