class DatabaseAdapter {
  constructor(options = {}) {
    this.options = options;
  }

  initialize() {
    throw new Error('DatabaseAdapter.initialize must be implemented');
  }

    insert() {
        throw new Error('DatabaseAdapter.insert must be implemented');
    }

    upsert() {
        throw new Error('DatabaseAdapter.upsert must be implemented');
    }

  list() {
    throw new Error('DatabaseAdapter.list must be implemented');
  }

  findById() {
    throw new Error('DatabaseAdapter.findById must be implemented');
  }

  health() {
    throw new Error('DatabaseAdapter.health must be implemented');
  }
}

module.exports = {
  DatabaseAdapter
};
