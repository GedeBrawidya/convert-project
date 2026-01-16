import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import FormatSelector from '@/components/FormatSelector';
import ConvertButton from '@/components/ConvertButton';
import ProgressIndicator from '@/components/ProgressIndicator';
import ResultDisplay from '@/components/ResultDisplay';

export default function Home() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('pdf');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState({ success: false, error: null, fileName: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) return;

    setIsLoading(true);
    setProgress(0);
    setResult({ success: false, error: null, fileName: null });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);

      setProgress(30);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      setProgress(70);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Konversi gagal' }));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const blob = await response.blob();
      setProgress(90);

      const url = window.URL.createObjectURL(blob);
      const fileName = file.name.split('.')[0];
      const downloadFileName = `${fileName}.${format}`;

      setProgress(100);

      // Simpan info untuk download
      setResult({
        success: true,
        error: null,
        fileName: downloadFileName,
        downloadUrl: url,
      });

      // Auto download
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFileName;
      a.click();
    } catch (error) {
      setResult({
        success: false,
        error: error.message || 'Terjadi kesalahan saat mengonversi file',
        fileName: null,
      });
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFormat('pdf');
    setResult({ success: false, error: null, fileName: null });
    setProgress(null);
  };

  const handleDownload = () => {
    if (result.downloadUrl) {
      const a = document.createElement('a');
      a.href = result.downloadUrl;
      a.download = result.fileName;
      a.click();
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background gradient */}
      <div className="bg-gradient" />

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="text-center fade-in-up">
            <h1 className="text-5xl font-bold text-text-primary mb-3">
              File Converter
            </h1>
            <p className="text-text-secondary text-lg">
              Konversi dokumen Anda dengan mudah dan cepat
            </p>
          </div>

          {/* Main card */}
          <div className="glass-card p-8 fade-in-up delay-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <FileUpload 
                onFileSelect={setFile} 
                selectedFile={file}
              />

              {/* Format Selector */}
              <FormatSelector
                selectedFormat={format}
                onFormatChange={setFormat}
              />

              {/* Convert Button */}
              <ConvertButton
                onClick={handleSubmit}
                disabled={isLoading}
                isLoading={isLoading}
                hasFile={!!file}
              />
            </form>
          </div>

          {/* Progress Indicator */}
          {isLoading && (
            <ProgressIndicator
              progress={progress}
              message="Mengonversi file Anda..."
            />
          )}

          {/* Result Display */}
          {(result.success || result.error) && (
            <ResultDisplay
              success={result.success}
              error={result.error}
              fileName={result.fileName}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          )}
        </div>
      </main>
    </div>
  );
}
