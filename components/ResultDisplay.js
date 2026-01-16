export default function ResultDisplay({ 
  success, 
  error, 
  fileName, 
  onDownload, 
  onReset 
}) {
  if (!success && !error) return null;

  return (
    <div className={`w-full glass-card p-6 fade-in-up ${error ? 'border-error' : 'border-success'}`}>
      {success ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-success"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-text-primary font-medium text-lg mb-1">
              Konversi Berhasil!
            </p>
            <p className="text-text-secondary text-sm">
              File {fileName} siap diunduh
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={onDownload}
              className="btn-glow flex-1"
            >
              <span className="flex items-center justify-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Unduh File
              </span>
            </button>
            <button
              onClick={onReset}
              className="px-6 py-3 bg-bg-secondary border border-border rounded-14 text-text-primary hover:bg-bg-card transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-error"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-text-primary font-medium text-lg mb-1">
              Konversi Gagal
            </p>
            <p className="text-text-secondary text-sm">
              {error || 'Terjadi kesalahan saat mengonversi file'}
            </p>
          </div>
          <button
            onClick={onReset}
            className="btn-glow w-full"
          >
            Coba Lagi
          </button>
        </div>
      )}
    </div>
  );
}

