import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useGeneralStore = defineStore('general', () => {
  const activeRequests = ref(0)
  const error = ref(null)

  const isLoading = computed(() => activeRequests.value > 0)
  const hasError = computed(() => error.value)

  const errorMessage = computed(() => error.value)

  function setError(val) {
    error.value = val
  }

  function startLoading() {
    activeRequests.value++
    setError(null)
  }

  function stopLoading() {
    activeRequests.value = Math.max(activeRequests.value - 1, 0)
  }

  async function generalApiOperation(arg) {
    const isFunction = typeof arg === 'function'
    const operation = isFunction ? arg : arg.operation
    const successCallback = isFunction ? null : arg.successCallback
    const errorCallBack = isFunction ? null : arg.errorCallBack

    if (typeof operation !== 'function') {
      throw new Error('operation must be a function')
    }

    startLoading()
    try {
      const res = await operation()
      if (successCallback) successCallback(res)
      return res
    } catch (err) {
      setError(err)
      if (errorCallBack) errorCallBack(err)
      throw err
    } finally {
      stopLoading()
    }
  }

  return {
    isLoading,
    hasError,
    startLoading,
    stopLoading,
    setError,
    errorMessage,
    generalApiOperation,
  }
})
