import { defineStore } from 'pinia'
import getStoreTemplate from './helpers/storeTemplate'
import { useGeneralStore } from './general'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import db from '@/firebase-config'
import { createUserDoc } from '@/stores/helpers/createUserDoc' // 🔑 додаємо

export const useUsersStore = defineStore('users', () => {
  const { generalApiOperation } = useGeneralStore()
  const base = getStoreTemplate('users', generalApiOperation)

  async function checkUserExists(uid) {
    try {
      const docRef = doc(db, 'users', uid)
      const docSnap = await getDoc(docRef)
      return docSnap.exists()
    } catch (e) {
      console.error('checkUserExists failed:', e)
      return false
    }
  }

  // створити документ з конкретним UID (через утиліту)
  async function createUserWithUID(userData) {
    try {
      return await createUserDoc(userData) // 🟢 замість дублювання
    } catch (error) {
      console.error('Failed to create user with UID:', error)
      throw error
    }
  }

  async function getUserByUID(uid) {
    try {
      const ref = doc(db, 'users', uid)
      const snap = await getDoc(ref)
      return snap.exists() ? { id: uid, ...snap.data() } : null
    } catch (e) {
      console.error('getUserByUID failed:', e)
      return null
    }
  }

  async function updateUserPhone(uid, phone) {
    return await generalApiOperation(async () => {
      const ref = doc(db, 'users', uid)
      await setDoc(ref, { phone }, { merge: true })
      return true
    })
  }

  return {
    ...base,
    checkUserExists,
    addUser: base.add,
    createUserWithUID,
    getUserByUID,
    updateUserPhone,
  }
})
