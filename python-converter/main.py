"""
Document Conversion Service using LibreOffice
FastAPI microservice for converting documents (DOCX, ODT, RTF, etc.) to various formats (PDF, DOCX, ...)
"""
import os
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import FileResponse
from pdf2docx import Converter

app = FastAPI(
    title="Document Converter",
    description="Microservice for converting documents using LibreOffice (headless)",
    version="1.0.0"
)

# Temporary directory for file processing
TMP_DIR = os.getenv("TMP_DIR", os.path.join(os.getcwd(), "tmp"))
os.makedirs(TMP_DIR, exist_ok=True)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "document-converter",
        "engine": "LibreOffice",
    }


@app.post("/convert")
async def convert_document(
    file: UploadFile = File(...),
    format: str = Form("pdf"),
):
    """
    Convert document to target format using LibreOffice headless
    
    Args:
        file: input document to convert (DOCX, ODT, RTF, PDF, etc.)
        format: target format (e.g. pdf, docx, odt, rtf, txt)
        
    Returns:
        Converted file as binary download
    """
    # Basic validation
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Normalize and validate target format
    target_format = (format or "pdf").lower()
    allowed_formats = {"pdf", "docx", "odt", "rtf", "txt"}
    if target_format not in allowed_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported target format: {target_format}. "
                   f"Allowed: {', '.join(sorted(allowed_formats))}",
        )
    
    # Generate unique temporary file names
    input_id = str(uuid.uuid4())
    input_path = os.path.join(TMP_DIR, f"{input_id}{Path(file.filename).suffix.lower()}")
    output_path = os.path.join(TMP_DIR, f"{input_id}.{target_format}")
    
    try:
        # Save uploaded file to temporary file
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)

        input_ext = Path(input_path).suffix.lower()

        # Special case: PDF -> DOCX uses pdf2docx (more reliable than LibreOffice)
        if input_ext == ".pdf" and target_format == "docx":
            try:
                pdf_converter = Converter(input_path)
                pdf_converter.convert(output_path)
                pdf_converter.close()
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"pdf2docx conversion failed: {e}"
                )
        else:
            # Generic conversion using LibreOffice headless
            # LibreOffice command: libreoffice --headless --convert-to <format> --outdir <dir> <file>
            args = [
                "libreoffice",
                "--headless",
                "--convert-to",
                target_format,
                "--outdir",
                TMP_DIR,
                input_path,
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
        
        # LibreOffice outputs file with same basename but target extension
        
        # Check if output file exists
        if not os.path.exists(output_path):
            # Try alternative naming pattern
            input_basename = Path(input_path).stem
            alternative_output = os.path.join(TMP_DIR, f"{input_basename}.{target_format}")
            if os.path.exists(alternative_output):
                output_path = alternative_output
            else:
                # List files in tmp dir for debugging
                tmp_files = os.listdir(TMP_DIR)
                raise HTTPException(
                    status_code=500,
                    detail=f"Conversion output not found. Files in tmp: {tmp_files[-5:]}"
                )
        
        # Return the converted file
        output_filename = f"{Path(file.filename).stem}.{target_format}"
        return FileResponse(
            output_path,
            media_type="application/octet-stream",
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
        raise HTTPException(
            status_code=500,
            detail=f"Conversion failed: {error_message}"
        )
    
    finally:
        # Clean up input file after processing
        if os.path.exists(input_path):
            try:
                os.remove(input_path)
            except:
                pass


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
