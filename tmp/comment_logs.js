const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\vsara\\Desktop\\taqadom-mobile-2.0';
const targetDirs = ['src', 'Services'];

// Keywords to PRESERVE (do not comment out logs containing these)
const keepKeywords = [
  'addManualLogRequest',
  'submitRegularization',
  '[REGULARIZATION CONTEXT]',
  'Regularization API Response',
  '[API CALL] addManualLogRequest',
  '[API RESPONSE] addManualLogRequest',
  '[API CALL] submitRegularization',
  '[API RESPONSE] submitRegularization'
];

function shouldKeep(line) {
  return keepKeywords.some(keyword => line.includes(keyword));
}

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');
  let changed = false;

  const newLines = lines.map(line => {
    // Check if line contains console.log and is NOT already commented out
    const trimmed = line.trim();
    if (trimmed.includes('console.log') && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
      if (!shouldKeep(line)) {
        changed = true;
        // Find the index of console.log
        const index = line.indexOf('console.log');
        // Insert // before console.log, preserving leading whitespace
        return line.slice(0, index) + '// ' + line.slice(index);
      }
    }
    return line;
  });

  if (changed) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    console.log(`✅ Processed: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.expo' && file !== '.gemini') {
        walkDir(fullPath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

targetDirs.forEach(dir => {
  const fullPath = path.join(rootDir, dir);
  if (fs.existsSync(fullPath)) {
    walkDir(fullPath);
  }
});

console.log('--- DONE ---');
