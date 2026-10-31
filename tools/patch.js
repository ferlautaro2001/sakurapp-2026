const fs = require('fs');

const [,, file, targetB64, replacementB64] = process.argv;

if (!file || !targetB64 || replacementB64 === undefined) {
  console.error('Uso: node patch.js <archivo> <target_b64> <replacement_b64>');
  process.exit(1);
}

const target = Buffer.from(targetB64, 'base64').toString('utf8');
const replacement = Buffer.from(replacementB64, 'base64').toString('utf8');

let content = fs.readFileSync(file, 'utf8');

// Normalizar CRLF para matching tolerante
if (!content.includes(target)) {
  // Intentar matching insensible a salto de linea (LF vs CRLF)
  const normContent = content.replace(/\r\n/g, '\n');
  const normTarget = target.replace(/\r\n/g, '\n');
  
  if (normContent.includes(normTarget)) {
    // Si el archivo original tenia CRLF, preservar estilo de saltos
    const usesCRLF = content.includes('\r\n');
    const normReplacement = replacement.replace(/\r\n/g, '\n');
    let patched = normContent.replace(normTarget, normReplacement);
    if (usesCRLF) {
      patched = patched.replace(/\n/g, '\r\n');
    }
    fs.writeFileSync(file, patched, 'utf8');
    console.log('OK (normalizado CRLF)');
    process.exit(0);
  }

  console.error('Target no encontrado');
  process.exit(2);
}

fs.writeFileSync(file, content.replace(target, replacement), 'utf8');
console.log('OK');
