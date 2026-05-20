const { DATABASE_SCHEMAS } = require('../schemas/database-schemas');

function runMigration(adapter) {
  const init = adapter.initialize();
  const collections = Object.values(DATABASE_SCHEMAS).map((schema) => schema.collection);

  return {
    migrationId: '001-filesystem-db-v1',
    status: init.available ? 'applied' : 'fallback',
    adapter: 'filesystem-db',
    collections,
    initialized: init,
    destructiveActions: false
  };
}

module.exports = {
  runMigration
};
