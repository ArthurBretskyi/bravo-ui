// src/stores/services.js

import { defineStore } from 'pinia'
import getStoreTemplate from './helpers/storeTemplate'
import { useGeneralStore } from './general'

export const useServicesStore = defineStore('services', () => {
  const { generalApiOperation } = useGeneralStore()
  const base = getStoreTemplate('services', generalApiOperation)

  return {
    ...base,
  }
})
