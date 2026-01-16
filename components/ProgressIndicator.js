export default function ProgressIndicator({ progress, message }) {
  if (!progress && !message) return null;

  return (
    <div className="w-full glass-card p-6 fade-in-up">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-shrink-0">
          <svg
            className="animate-spin h-6 w-6 text-accent"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-text-primary font-medium">{message || 'Memproses...'}</p>
          {progress !== null && progress !== undefined && (
            <p className="text-text-secondary text-sm mt-1">{progress}%</p>
          )}
        </div>
      </div>
      {progress !== null && progress !== undefined && (
        <div className="w-full bg-bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-[#9d7bfa] transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

