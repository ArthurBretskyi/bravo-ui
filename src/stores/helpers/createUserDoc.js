import { doc, getDoc, setDoc } from 'firebase/firestore'
import db from '@/firebase-config'

export async function createUserDoc(user, extraData = {}) {
  if (!user?.uid) throw new Error('UID is required to create user doc')

  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  // якщо документ вже існує → нічого не створюємо/не перезаписуємо
  if (userSnap.exists()) {
    return userSnap.data()
  }

  // name з Google може бути "John Doe"
  let firstName = extraData.firstName || null
  let lastName = extraData.lastName || null

  if (user.displayName && (!firstName || !lastName)) {
    const parts = user.displayName.split(' ')
    firstName ||= parts[0] || null
    lastName ||= parts.slice(1).join(' ') || null
  }

  // username: якщо не заданий → беремо частину email до @
  const username = extraData.username || (user.email ? user.email.split('@')[0] : null)

  const userDoc = {
    uid: user.uid,
    email: user.email || null,
    role: extraData.role || 'user', // початкове значення тільки при створенні
    firstName,
    lastName,
    username,
    phone: extraData.phone || null,
    photoURL: user.photoURL || null,
    createdAt: new Date().toISOString(),
    ...extraData, // якщо ще щось треба докинути
  }

  await setDoc(userRef, userDoc)

  return userDoc
}
