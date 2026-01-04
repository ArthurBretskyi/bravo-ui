// stores/reviews.js
import { defineStore } from 'pinia'
import getStoreTemplate from './helpers/storeTemplate'
import { useGeneralStore } from './general'

export const useReviewsStore = defineStore('reviews', () => {
  const { generalApiOperation } = useGeneralStore()
  const base = getStoreTemplate('reviews', generalApiOperation)

  return {
    ...base,
  }
})
