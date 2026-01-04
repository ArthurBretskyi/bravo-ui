import { defineStore } from 'pinia'
import getStoreTemplate from './helpers/storeTemplate'
import { useGeneralStore } from './general'

export const useGalleryStore = defineStore('gallery', () => {
  const { generalApiOperation } = useGeneralStore()
  const base = getStoreTemplate('gallery', generalApiOperation)

  return {
    ...base,
  }
})
