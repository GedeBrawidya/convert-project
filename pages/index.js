import {useState} from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState("pdf");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("format", format);

    const response = await fetch('/api/convert', {
      method: 'POST',
      body: formData,
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement( "a" );
    const fileName = file.name.split(".")[0];
    a.href = url;
    a.download = `${fileName}.${format}`;
    a.click();
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-3xl font-bold">File Converter</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="pdf">PDF</option>
          <option value="docx">Word (DOCX)</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Convert
        </button>
      </form>
    </main>
    )
  };
