export interface EntityRepository<TEntity, TKey> {
  getById: (id: TKey) => Promise<TEntity | undefined>
  getAll: () => Promise<TEntity[]>
  save: (entity: TEntity) => Promise<TKey>
  saveMany: (entities: TEntity[]) => Promise<TKey[]>
  remove: (id: TKey) => Promise<void>
  clear: () => Promise<void>
}
