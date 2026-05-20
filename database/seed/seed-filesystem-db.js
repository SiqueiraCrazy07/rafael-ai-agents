const { FilesystemDbAdapter } = require('../adapters/filesystem-db-adapter');
const { runMigration } = require('../migrations/001-filesystem-db-v1');
const { createRepositories } = require('../repositories/repository-factory');

function createDatabaseContext(options = {}) {
  const adapter = new FilesystemDbAdapter(options);
  const migration = runMigration(adapter);
  const repositories = createRepositories(adapter);

  return {
    adapter,
    migration,
    repositories
  };
}

module.exports = {
  createDatabaseContext
};
