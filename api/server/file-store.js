const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toIsoFileStamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function safeReadDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      return { available: false, files: [], error: null };
    }

    return {
      available: true,
      files: fs.readdirSync(dirPath),
      error: null
    };
  } catch (error) {
    return {
      available: false,
      files: [],
      error: error.message
    };
  }
}

function listJsonFiles(relativeDir) {
  const absoluteDir = path.join(ROOT_DIR, relativeDir);
  const directory = safeReadDir(absoluteDir);

  if (!directory.available) {
    return {
      available: false,
      sourcePath: absoluteDir,
      files: [],
      readErrors: directory.error ? [{ sourcePath: absoluteDir, error: directory.error }] : []
    };
  }

  const files = directory.files
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => {
      const sourcePath = path.join(absoluteDir, fileName);
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
    sourcePath: absoluteDir,
    files,
    readErrors: []
  };
}

function readJsonFile(file) {
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

function readLatestJson(relativeDir) {
  const listing = listJsonFiles(relativeDir);

  if (!listing.available || listing.files.length === 0) {
    return {
      available: false,
      sourceDir: listing.sourcePath,
      sourcePath: null,
      fileName: null,
      updatedAt: null,
      data: null,
      readErrors: listing.readErrors,
      fallback: {
        safeMode: true,
        reason: listing.available ? 'no-json-files' : 'directory-unavailable'
      }
    };
  }

  for (const file of listing.files) {
    const parsed = readJsonFile(file);
    if (parsed.ok) {
      return {
        available: true,
        sourceDir: listing.sourcePath,
        sourcePath: parsed.sourcePath,
        fileName: parsed.fileName,
        updatedAt: parsed.updatedAt,
        data: parsed.data,
        readErrors: []
      };
    }

    listing.readErrors.push({
      sourcePath: parsed.sourcePath,
      error: parsed.error
    });
  }

  return {
    available: false,
    sourceDir: listing.sourcePath,
    sourcePath: null,
    fileName: null,
    updatedAt: null,
    data: null,
    readErrors: listing.readErrors,
    fallback: {
      safeMode: true,
      reason: 'all-json-files-invalid'
    }
  };
}

function readJsonHistory(relativeDir, limit = 20) {
  const listing = listJsonFiles(relativeDir);

  if (!listing.available) {
    return {
      available: false,
      sourceDir: listing.sourcePath,
      items: [],
      readErrors: listing.readErrors,
      fallback: {
        safeMode: true,
        reason: 'directory-unavailable'
      }
    };
  }

  const readErrors = [];
  const items = [];

  for (const file of listing.files.slice(0, limit)) {
    const parsed = readJsonFile(file);
    if (parsed.ok) {
      items.push({
        fileName: parsed.fileName,
        sourcePath: parsed.sourcePath,
        updatedAt: parsed.updatedAt,
        data: parsed.data
      });
    } else {
      readErrors.push({
        sourcePath: parsed.sourcePath,
        error: parsed.error
      });
    }
  }

  return {
    available: items.length > 0,
    sourceDir: listing.sourcePath,
    totalFiles: listing.files.length,
    items,
    readErrors,
    fallback: items.length > 0 ? null : { safeMode: true, reason: 'no-readable-json-files' }
  };
}

function persistApiReport(reportName, payload, options = {}) {
  const directoryName = options.directoryName || 'api';
  const runtimeDir = path.join(ROOT_DIR, 'runtime-data', directoryName);
  const memoryDir = path.join(ROOT_DIR, 'memory', directoryName);
  ensureDir(runtimeDir);
  ensureDir(memoryDir);

  const fileName = `${reportName}-${toIsoFileStamp()}.json`;
  const runtimePath = path.join(runtimeDir, fileName);
  const memoryPath = path.join(memoryDir, fileName);
  const body = JSON.stringify(payload, null, 2);

  fs.writeFileSync(runtimePath, body);
  fs.writeFileSync(memoryPath, body);

  return {
    runtimePath,
    memoryPath
  };
}

function getRepositoryRoot() {
  return ROOT_DIR;
}

module.exports = {
  ensureDir,
  getRepositoryRoot,
  listJsonFiles,
  persistApiReport,
  readJsonHistory,
  readLatestJson,
  toIsoFileStamp
};
