class BaseRepository {
  constructor({ adapter, collection, sourceDirs = [], normalizer }) {
    this.adapter = adapter;
    this.collection = collection;
    this.sourceDirs = sourceDirs;
    this.normalizer = normalizer;
  }

  insert(record) {
    return this.adapter.insert(this.collection, record);
  }

  upsert(record) {
    if (typeof this.adapter.upsert === 'function') {
      return this.adapter.upsert(this.collection, record);
    }

    return this.insert(record);
  }

  list(query = {}) {
    return this.adapter.list(this.collection, query);
  }

  findById(id, idField = 'id') {
    return this.adapter.findById(this.collection, id, idField);
  }
}

module.exports = {
  BaseRepository
};
