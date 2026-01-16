export default function FormatSelector({ selectedFormat, onFormatChange }) {
  const formats = [
    { value: 'pdf', label: 'PDF', icon: '📄' },
    { value: 'docx', label: 'Word (DOCX)', icon: '📝' },
    { value: 'odt', label: 'OpenDocument (ODT)', icon: '📋' },
    { value: 'rtf', label: 'Rich Text (RTF)', icon: '📃' },
    { value: 'txt', label: 'Plain Text (TXT)', icon: '📄' },
  ];

  return (
    <div className="w-full">
      <label className="block text-text-primary font-medium mb-3">
        Format Output
      </label>
      <select
        value={selectedFormat}
        onChange={(e) => onFormatChange(e.target.value)}
        className="custom-select w-full"
      >
        {formats.map((format) => (
          <option key={format.value} value={format.value}>
            {format.icon} {format.label}
          </option>
        ))}
      </select>
      <p className="text-text-secondary text-sm mt-2">
        File akan dikonversi ke format {formats.find(f => f.value === selectedFormat)?.label}
      </p>
    </div>
  );
}

