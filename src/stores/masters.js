import { defineStore } from 'pinia'
import getStoreTemplate from './helpers/storeTemplate'
import { useGeneralStore } from './general'

export const useMastersStore = defineStore('masters', () => {
  const { generalApiOperation } = useGeneralStore()
  const base = getStoreTemplate('masters', generalApiOperation)

  return {
    ...base,
  }
})
