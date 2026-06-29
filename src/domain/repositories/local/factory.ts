import type { Table } from 'dexie'

import type { EntityRepository } from '../entity-repository'

export function createEntityRepository<TEntity, TKey, TInsertType>(
  table: Table<TEntity, TKey, TInsertType>,
): EntityRepository<TEntity, TKey> {
  return {
    getById(id) {
      return table.get(id)
    },
    getAll() {
      return table.toArray()
    },
    save(entity) {
      return table.put(entity as unknown as TInsertType)
    },
    async saveMany(entities) {
      return table.bulkPut(entities as unknown as TInsertType[], {
        allKeys: true,
      })
    },
    remove(id) {
      return table.delete(id)
    },
    clear() {
      return table.clear()
    },
  }
}
