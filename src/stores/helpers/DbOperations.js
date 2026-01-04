import firebaseDB from '@/firebase-config'
import {
  doc,
  collection,
  getDocs,
  getDoc,
  addDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  updateDoc,
  setDoc,
  query,
  where,
  onSnapshot,
  documentId,
} from 'firebase/firestore'

class DbOperations {
  constructor(collectionTitle) {
    this.dbCollection = collection(firebaseDB, `/${collectionTitle}`)
  }

  getListFromSnapshot(snapshot) {
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  async loadItemsList() {
    const snapshot = await getDocs(this.dbCollection)
    return this.getListFromSnapshot(snapshot)
  }

  subscribeToList(callback) {
    return onSnapshot(this.dbCollection, (snapshot) => {
      const data = this.getListFromSnapshot(snapshot)
      callback(data)
    })
  }

  async addItem(item) {
    await addDoc(this.dbCollection, item)
    return true
  }

  async addItemWithCustomId(id, item) {
    await setDoc(doc(this.dbCollection, id), item, { merge: true })
    return true
  }

  async addItemToArray(id, arrayProperty, value) {
    const item = await this.getItemById(id)
    if (item[arrayProperty]) {
      await updateDoc(doc(this.dbCollection, id), {
        [arrayProperty]: arrayUnion(value),
      })
    } else {
      await this.addItemWithCustomId(id, {
        [arrayProperty]: [value],
      })
    }
    return true
  }

  async removeItemFromArray(id, arrayProperty, value) {
    await updateDoc(doc(this.dbCollection, id), {
      [arrayProperty]: arrayRemove(value),
    })
    return true
  }

  async deleteItem(id) {
    await deleteDoc(doc(this.dbCollection, id))
    return true
  }

  async updateItem(itemId, data) {
    await updateDoc(doc(this.dbCollection, itemId), data)
    return true
  }

  async getItemById(itemId) {
    const docSnap = await getDoc(doc(this.dbCollection, itemId))
    return docSnap.exists() ? docSnap.data() : {}
  }

  async loadFilteredData(fieldTitle, compareOperator, valueToCompare) {
    const q = query(this.dbCollection, where(fieldTitle, compareOperator, valueToCompare))
    const snapshot = await getDocs(q)
    return this.getListFromSnapshot(snapshot)
  }

  async loadDocumentsFromIdsList(idsList) {
    const q = query(this.dbCollection, where(documentId(), 'in', idsList))
    const snapshot = await getDocs(q)
    return this.getListFromSnapshot(snapshot)
  }
}

export default DbOperations
