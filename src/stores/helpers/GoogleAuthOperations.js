import { auth as firebaseAuth } from '@/firebase-config.js'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'

class GoogleAuthOperations {
  constructor({
    saveCredentialsInLocalStorage = true,
    authCredentialLocalStorageKey = 'authCredential',
  } = {}) {
    this.auth = firebaseAuth
    this.saveCredentialsInLocalStorage = saveCredentialsInLocalStorage
    this.authCredentialLocalStorageKey = authCredentialLocalStorageKey
  }

  async loginWithGoogleAccountPopup() {
    const provider = new GoogleAuthProvider()
    const loginResult = await signInWithPopup(this.auth, provider)
    if (this.saveCredentialsInLocalStorage) {
      localStorage.setItem(this.authCredentialLocalStorageKey, JSON.stringify(loginResult?.user))
    }
    return loginResult?.user
  }

  async signUpWithEmailAndPassword({ email, password }) {
    if (!email || !password) throw new Error('Email or password missing')
    const loginResult = await createUserWithEmailAndPassword(this.auth, email, password)
    return loginResult?.user
  }

  async signInWithEmailAndPassword({ email, password }) {
    if (!email || !password) throw new Error('Email or password missing')
    const loginResult = await signInWithEmailAndPassword(this.auth, email, password)
    return loginResult?.user
  }

  async logout() {
    await signOut(this.auth)
    localStorage.removeItem(this.authCredentialLocalStorageKey)
    return true
  }
}

export default new GoogleAuthOperations(import.meta.VITE_SAVE_CREDENTIALS_IN_LOCAL_STORE)
