const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const pdfParse = require('pdf-parse');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const readAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  });

const normalizeBase64 = (raw) => {
  if (!raw) return '';
  if (raw.startsWith('data:application/pdf')) {
    return raw.split(',')[1] || '';
  }
  return raw;
};

const isPdfRow = (row) => {
  const name = (row.name || '').toLowerCase();
  const fileType = (row.file_type || '').toLowerCase();
  return fileType === 'pdf' || name.endsWith('.pdf');
};

const parsePdfText = async (content) => {
  const base64 = normalizeBase64(content);
  if (!base64) return '';
  const buffer = Buffer.from(base64, 'base64');
  const parsed = await pdfParse(buffer);
  return parsed.text || '';
};

const parseMetadata = (raw) => {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
};

const main = async () => {
  try {
    const rows = await readAll('SELECT id, name, file_type, content, metadata FROM sources');
    let updated = 0;

    for (const row of rows) {
      if (!isPdfRow(row)) continue;
      if (!row.content) continue;

      const metadata = parseMetadata(row.metadata);
      if (metadata.text && metadata.text.trim().length > 0) continue;

      try {
        const text = await parsePdfText(row.content);
        if (!text.trim()) continue;
        const nextMetadata = { ...metadata, text };
        const result = await run('UPDATE sources SET metadata = ? WHERE id = ?', [
          JSON.stringify(nextMetadata),
          row.id
        ]);
        if (result.changes > 0) updated += 1;
      } catch (err) {
        console.error(`PDF parse failed for id=${row.id} (${row.name || 'unknown'}):`, err);
      }
    }

    console.log(`Done. Updated ${updated} PDF rows with extracted text.`);
  } catch (err) {
    console.error('Reparse failed:', err);
    process.exitCode = 1;
  } finally {
    db.close();
  }
};

main();
