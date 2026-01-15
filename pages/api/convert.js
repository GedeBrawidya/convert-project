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

function convertFile (inputPath, outputFormat) {
    return new Promise ((resolve, reject) => {
        const args = [
            "--headless",
            "--convert-to",
            outputFormat,
            "--outdir",
            tmp_dir,
            inputPath,
        ];
        const converter = spawn('libreoffice', args);

        converter.on("close", (code) => {
            if (code === 0) {
                const outputFile = path.join(
                    tmp_dir, path.basename(
                        inputPath, path.extname(inputPath)) + "." + outputFormat
                    );
                    resolve (outputFile);                    
                }else  {
                    reject (new Error("Conversion failed "));
            } 
     });
    });
}

export default async function handler (req, res) {
    if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method not allowed'});
    const form = formidable({ multiples: false, uploadDir: tmp_dir, keepExtensions: true });

    form.parse(req,async (err, fields, files) => {
        if (err) return res.status(500).json({ error: "File parse error"});
        const file = files.file?.[0] || files.file;
        const format = fields.format?.[0] || fields.format;
        try {
            const converted = await convertFile(file.filepath, format);
            const data = fs.readFileSync(converted);
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader(
                "content-Disposition",
                `attachment; filename=" + path.basename(converted)}"`);
            res.send(data);
        } catch (e) {
            res.status(500).json({ error: e.message});
        }    
    });
}
    


