const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

function listJsonFiles(relativeDir) {
  const sourceDir = path.join(ROOT_DIR, relativeDir);

  if (!fs.existsSync(sourceDir)) {
    return {
      available: false,
      sourceDir,
      files: [],
      readErrors: [],
      fallback: {
        safeMode: true,
        reason: 'source-directory-missing'
      }
    };
  }

  const files = fs.readdirSync(sourceDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => {
      const sourcePath = path.join(sourceDir, fileName);
      const stat = fs.statSync(sourcePath);

      return {
        fileName,
        sourcePath,
        updatedAt: stat.mtime.toISOString(),
        updatedMs: stat.mtimeMs
      };
    })
    .sort((left, right) => right.updatedMs - left.updatedMs);

  return {
    available: true,
    sourceDir,
    files,
    readErrors: [],
    fallback: files.length > 0 ? null : {
      safeMode: true,
      reason: 'source-directory-empty'
    }
  };
}

function readJson(file) {
  try {
    return {
      ok: true,
      sourcePath: file.sourcePath,
      fileName: file.fileName,
      updatedAt: file.updatedAt,
      data: JSON.parse(fs.readFileSync(file.sourcePath, 'utf8'))
    };
  } catch (error) {
    return {
      ok: false,
      sourcePath: file.sourcePath,
      fileName: file.fileName,
      updatedAt: file.updatedAt,
      error: error.message
    };
  }
}

function readJsonHistory(relativeDir, limit = 100) {
  const listing = listJsonFiles(relativeDir);
  const items = [];
  const readErrors = [...listing.readErrors];

  if (!listing.available) {
    return {
      ...listing,
      items
    };
  }

  for (const file of listing.files.slice(0, limit)) {
    const parsed = readJson(file);
    if (parsed.ok) {
      items.push(parsed);
    } else {
      readErrors.push({
        sourcePath: parsed.sourcePath,
        fileName: parsed.fileName,
        error: parsed.error
      });
    }
  }

  return {
    available: items.length > 0,
    sourceDir: listing.sourceDir,
    totalFiles: listing.files.length,
    items,
    readErrors,
    fallback: items.length > 0 ? null : {
      safeMode: true,
      reason: listing.files.length > 0 ? 'all-json-invalid' : 'source-directory-empty'
    }
  };
}

module.exports = {
  readJsonHistory
};
