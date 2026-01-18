import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import formidable  from 'formidable';

export const config = {
    api : {
        bodyParser : false },    
    };

const tmp_dir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tmp_dir)) fs.mkdirSync(tmp_dir);

// Map format ke LibreOffice filter format
const formatMap = {
    'pdf': 'pdf',
    'docx': 'docx', // LibreOffice akan otomatis menggunakan format yang tepat
    'odt': 'odt',
    'rtf': 'rtf',
    'txt': 'txt',
};

function convertFile(inputPath, outputFormat) {
    return new Promise((resolve, reject) => {
        // Gunakan format filter yang benar untuk LibreOffice
        const libreOfficeFormat = formatMap[outputFormat] || outputFormat;
        
        const args = [
            "--headless",
            "--convert-to",
            libreOfficeFormat,
            "--outdir",
            tmp_dir,
            inputPath,
        ];

        let stderr = '';
        const converter = spawn('libreoffice', args);

        converter.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        converter.on("close", async (code) => {
            if (code === 0) {
                // Beri waktu untuk LibreOffice menyelesaikan penulisan file
                await new Promise(resolve => setTimeout(resolve, 500));

                // Cari file output yang benar-benar dibuat
                const inputBasename = path.basename(inputPath, path.extname(inputPath));
                const inputExt = path.extname(inputPath);
                const expectedOutputFile = path.join(tmp_dir, `${inputBasename}.${outputFormat}`);
                
                // Cek apakah file yang diharapkan ada
                if (fs.existsSync(expectedOutputFile)) {
                    resolve(expectedOutputFile);
                    return;
                }

                // Jika tidak ada, cari file dengan ekstensi yang sama di tmp_dir
                // yang dibuat setelah file input (berdasarkan timestamp atau nama)
                const files = fs.readdirSync(tmp_dir);
                
                // Cari file yang cocok dengan pattern: basename + ekstensi output
                let matchingFile = files.find(f => {
                    const filePath = path.join(tmp_dir, f);
                    const stats = fs.statSync(filePath);
                    return (
                        f.startsWith(inputBasename) && 
                        f.endsWith(`.${outputFormat}`) &&
                        f !== path.basename(inputPath) &&
                        !f.includes(inputExt.replace('.', '')) // Pastikan bukan file input
                    );
                });

                if (matchingFile) {
                    resolve(path.join(tmp_dir, matchingFile));
                    return;
                }

                // Debug: list semua file di tmp_dir untuk troubleshooting
                const allFiles = files.map(f => {
                    const filePath = path.join(tmp_dir, f);
                    const stats = fs.statSync(filePath);
                    return `${f} (${stats.mtime.toISOString()})`;
                }).join(', ');

                reject(new Error(
                    `File output tidak ditemukan. ` +
                    `Mencari: ${inputBasename}.${outputFormat}. ` +
                    `Files di tmp: ${allFiles}. ` +
                    `Stderr: ${stderr || 'tidak ada error'}`
                ));
            } else {
                reject(new Error(`Konversi gagal dengan kode ${code}. Stderr: ${stderr || 'tidak ada error'}`));
            }
        });

        converter.on("error", (err) => {
            reject(new Error(`Gagal menjalankan LibreOffice: ${err.message}`));
        });
    });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const form = formidable({ 
            multiples: false, 
            uploadDir: tmp_dir, 
            keepExtensions: true 
        });

        const { fields, files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                    console.error('Formidable parse error:', err);
                    reject(new Error(`File parse error: ${err.message}`));
                    return;
                }
                resolve({ fields, files });
            });
        });

        const file = files.file?.[0] || files.file;
        const format = fields.format?.[0] || fields.format;

        if (!file) {
            console.error('No file found in request');
            return res.status(400).json({ error: "File tidak ditemukan" });
        }

        if (!format) {
            console.error('No format specified');
            return res.status(400).json({ error: "Format tidak ditentukan" });
        }

        if (!file.filepath) {
            console.error('File filepath missing:', file);
            return res.status(400).json({ error: "File path tidak valid" });
        }

        console.log('Starting conversion:', {
            inputFile: file.filepath,
            inputName: file.originalFilename || file.newFilename || 'unknown',
            format: format,
            fileSize: file.size || 'unknown'
        });

        // Konversi file
        const converted = await convertFile(file.filepath, format);

        console.log('Conversion completed, output file:', converted);

        // Pastikan file benar-benar ada sebelum membaca
        if (!fs.existsSync(converted)) {
            // List semua file di tmp untuk debugging
            const tmpFiles = fs.readdirSync(tmp_dir).slice(-10); // Ambil 10 file terakhir
            console.error('Output file not found:', {
                expected: converted,
                filesInTmp: tmpFiles
            });
            return res.status(500).json({ 
                error: `File output tidak ditemukan: ${path.basename(converted)}. Files di tmp: ${tmpFiles.join(', ')}` 
            });
        }

        // Baca file yang sudah dikonversi
        const data = fs.readFileSync(converted);
        const outputFileName = path.basename(converted);

        // Set headers untuk download
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${outputFileName}"`
        );

        res.send(data);

    } catch (error) {
        console.error('API Error:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // Pastikan response belum dikirim
        if (!res.headersSent) {
            res.status(500).json({ 
                error: error.message || 'Terjadi kesalahan saat memproses request' 
            });
        }
    }
}
    


