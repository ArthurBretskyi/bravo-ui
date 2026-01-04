import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { auth } from '@/firebase-config'
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore'
import db from '@/firebase-config'

import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from 'firebase/auth'

import { useGeneralStore } from './general'
import { createUserDoc } from '@/stores/helpers/createUserDoc' // 🔑 додаємо утиліту

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const role = ref(null)

  function setUser(payload) {
    user.value = payload
  }
  function getUser() {
    return user.value
  }
  function getRole() {
    return role.value
  }

  const isAdminRaw = ref(null)
  const isAdmin = computed(() => isAdminRaw.value === true)

  async function fetchUserRole(uid) {
    const userDocRef = doc(db, 'users', uid)
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      const data = userDoc.data()
      role.value = data.role || 'user'
      isAdminRaw.value = role.value === 'admin' // 🔑 тільки через role

      if (user.value) {
        user.value.role = role.value
        user.value.isAdmin = isAdminRaw.value
      }

      return role.value
    } else {
      console.warn('User document not found. No role available yet.')
      role.value = 'user'
      isAdminRaw.value = false

      if (user.value) {
        user.value.role = role.value
        user.value.isAdmin = false
      }

      return role.value
    }
  }

  async function loginWithGoogleAccount() {
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)
    const newUser = userCredential.user

    // 🟢 використовуємо єдину точку
    await createUserDoc(newUser)

    user.value = newUser
    role.value = await fetchUserRole(newUser.uid)
    return newUser
  }

  async function registerWithEmail(email, password) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const newUser = userCredential.user

    // 🟢 теж через утиліту
    await createUserDoc(newUser)

    user.value = newUser
    role.value = 'user'
    return newUser
  }

  async function loginWithEmail(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    user.value = userCredential.user
    role.value = await fetchUserRole(userCredential.user.uid)
    return userCredential.user
  }

  async function logout() {
    await signOut(auth)
    user.value = null
    role.value = null
    isAdminRaw.value = false
  }

  async function initAuth() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (userCredential) => {
        user.value = userCredential
        if (userCredential) {
          role.value = await fetchUserRole(userCredential.uid)
        } else {
          role.value = null
          isAdminRaw.value = false
        }
        resolve(userCredential)
      })
    })
  }

  // ----- PROFILE / ACCOUNT -----
  async function updateUserProfile(uid, updatedData) {
    const { generalApiOperation } = useGeneralStore()
    return generalApiOperation(
      async () => {
        const userDocRef = doc(db, 'users', uid)
        await updateDoc(userDocRef, updatedData)

        if (user.value) {
          user.value = {
            ...user.value,
            ...updatedData,
          }

          if (updatedData.role) {
            role.value = updatedData.role
            isAdminRaw.value = role.value === 'admin'
            user.value.isAdmin = isAdminRaw.value
          }
        }

        return true
      },
      { loadingMessage: 'Оновлення профілю...' },
    )
  }

  async function reauthenticateUser(password = null) {
    const current = auth.currentUser
    if (!current) throw new Error('No user')

    if (current.providerData[0]?.providerId === 'password') {
      if (!password) throw new Error('Password required')
      const credential = EmailAuthProvider.credential(current.email, password)
      await reauthenticateWithCredential(current, credential)
    } else if (current.providerData[0]?.providerId === 'google.com') {
      const provider = new GoogleAuthProvider()
      await reauthenticateWithPopup(current, provider)
    }
  }

  async function deleteAccountAndUserDoc(password = null) {
    const current = auth.currentUser
    if (!current) return
    const uid = current.uid

    try {
      await reauthenticateUser(password)

      const q = query(collection(db, 'appointments'), where('userId', '==', uid))
      const snap = await getDocs(q)

      const updates = snap.docs.map((d) =>
        updateDoc(d.ref, {
          userId: null,
          userName: 'Deleted user',
        }),
      )
      await Promise.all(updates)

      await deleteDoc(doc(db, 'users', uid))
      await deleteUser(current)

      user.value = null
      role.value = null
      isAdminRaw.value = false
    } catch (e) {
      if (e?.code === 'auth/requires-recent-login') {
        throw new Error('requires-recent-login')
      }
      throw e
    }
  }

  return {
    user,
    role,
    isAdmin,
    isAdminRaw,
    setUser,
    getUser,
    getRole,
    loginWithGoogleAccount,
    registerWithEmail,
    loginWithEmail,
    logout,
    initAuth,
    fetchUserRole,
    updateUserProfile,
    reauthenticateUser,
    deleteAccountAndUserDoc,
  }
})
