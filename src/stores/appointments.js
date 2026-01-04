import { defineStore } from 'pinia'
import getStoreTemplate from './helpers/storeTemplate'
import { useGeneralStore } from './general'
import { onSnapshot } from 'firebase/firestore'
import db from '@/firebase-config'
import { useAuthStore } from './auth'

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'

export const useAppointmentsStore = defineStore('appointments', () => {
  const { generalApiOperation } = useGeneralStore()
  const base = getStoreTemplate('appointments', generalApiOperation)

  // ----- HELPERS -----
  function parseUtcAsLocal(isoString) {
    const [y, m, d, h, min, sec] = isoString.split(/[-T:.Z]/).map(Number)
    return new Date(y, m - 1, d, h, min || 0, sec || 0)
  }

  const fetchByMasterAndDate = async (masterId, { year, month, day }) => {
    return generalApiOperation({
      operation: async () => {
        const startOfDay = new Date(year, month, day, 0, 0, 0, 0)
        const endOfDay = new Date(year, month, day, 23, 59, 59, 999)

        const q = query(collection(db, 'appointments'), where('masterId', '==', masterId))
        const snapshot = await getDocs(q)

        const busyStatuses = ['pending', 'pendingConfirmation', 'booked', 'completed', 'confirmed']
        const results = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data()

            if (!busyStatuses.includes(data.status || 'pending')) return null

            const startDate =
              typeof data.start === 'string'
                ? parseUtcAsLocal(data.start)
                : data.start?.toDate
                  ? data.start.toDate()
                  : new Date(data.start)

            const endDate =
              typeof data.end === 'string'
                ? parseUtcAsLocal(data.end)
                : data.end?.toDate
                  ? data.end.toDate()
                  : new Date(data.end)

            if (!startDate || isNaN(startDate.getTime())) return null
            if (!endDate || isNaN(endDate.getTime())) return null

            const passesFilter = startDate >= startOfDay && startDate <= endOfDay
            if (!passesFilter) return null

            // 🟢 тягнемо назву сервісу
            let serviceName = 'Невідома послуга'
            if (data.serviceId) {
              const serviceDoc = await getDoc(doc(db, 'services', data.serviceId))
              if (serviceDoc.exists()) {
                serviceName = serviceDoc.data().title || serviceName
              }
            }

            // 🟢 тягнемо ім’я користувача
            let userName = 'Невідомий клієнт'
            let userPhone = data.phone || null
            if (data.userId) {
              const userDoc = await getDoc(doc(db, 'users', data.userId))
              if (userDoc.exists()) {
                const u = userDoc.data()
                userName = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || userName
                userPhone = userPhone || u.phone || null // якщо phone вже в appointment, тримаємо його, інакше беремо з users
              }
            }

            return {
              id: docSnap.id,
              ...data,
              masterId: data.masterId,
              start: startDate,
              end: endDate,
              serviceName,
              userName,
              userPhone,
              price: data.price || 0,
              additionalCost: data.additionalCost || 0,
              extraMasterBonus: data.extraMasterBonus || 0,
              comment: data.comment || '',
            }
          }),
        )

        return results.filter(Boolean)
      },
    })
  }

  // ----- FETCH BY MASTER & RANGE -----
  const fetchByMasterAndRange = async (masterId, startDate, endDate) => {
    return generalApiOperation({
      operation: async () => {
        const q = query(collection(db, 'appointments'), where('masterId', '==', masterId))
        const snapshot = await getDocs(q)

        const busyStatuses = ['pending', 'pendingConfirmation', 'booked', 'completed', 'confirmed']

        const results = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data()

            if (!busyStatuses.includes(data.status || 'pending')) return null

            const start =
              typeof data.start === 'string'
                ? parseUtcAsLocal(data.start)
                : data.start?.toDate
                  ? data.start.toDate()
                  : new Date(data.start)

            const end =
              typeof data.end === 'string'
                ? parseUtcAsLocal(data.end)
                : data.end?.toDate
                  ? data.end.toDate()
                  : new Date(data.end)

            if (!start || isNaN(start.getTime())) return null
            if (!end || isNaN(end.getTime())) return null

            const inRange = start >= startDate && start <= endDate
            if (!inRange) return null

            // 🟢 тягнемо назву сервісу
            let serviceName = 'Невідома послуга'
            if (data.serviceId) {
              const serviceDoc = await getDoc(doc(db, 'services', data.serviceId))
              if (serviceDoc.exists()) {
                serviceName = serviceDoc.data().title || serviceName
              }
            }

            // 🟢 тягнемо ім’я користувача
            let userName = 'Невідомий клієнт'
            let userPhone = data.phone || null
            if (data.userId) {
              const userDoc = await getDoc(doc(db, 'users', data.userId))
              if (userDoc.exists()) {
                const u = userDoc.data()
                userName = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || userName
                userPhone = userPhone || u.phone || null
              }
            }

            return {
              id: docSnap.id,
              ...data,
              masterId: data.masterId,
              start,
              end,
              serviceName,
              userName,
              userPhone,
              price: data.price || 0,
              additionalCost: data.additionalCost || 0,
              extraMasterBonus: data.extraMasterBonus || 0,
              comment: data.comment || '',
            }
          }),
        )

        return results.filter(Boolean)
      },
    })
  }

  const fetchByMasterUserAndDate = async (masterUserId, { year, month, day }) => {
    return generalApiOperation({
      operation: async () => {
        const startOfDay = new Date(year, month, day, 0, 0, 0, 0)
        const endOfDay = new Date(year, month, day, 23, 59, 59, 999)

        const q = query(collection(db, 'appointments'), where('masterUserId', '==', masterUserId))
        const snapshot = await getDocs(q)

        const busyStatuses = ['pending', 'pendingConfirmation', 'booked', 'completed', 'confirmed']

        const results = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          if (!busyStatuses.includes(data.status || 'pending')) return null

          const start = data.start?.toDate ? data.start.toDate() : new Date(data.start)
          if (!start || isNaN(start.getTime())) return null

          if (start >= startOfDay && start <= endOfDay) {
            return { id: docSnap.id, ...data }
          }
          return null
        })

        return results.filter(Boolean)
      },
    })
  }

  // ----- FETCH BY USER -----
  const fetchByUser = async (uid) => {
    return generalApiOperation({
      operation: async () => {
        const q = query(collection(db, 'appointments'), where('userId', '==', uid))
        const snap = await getDocs(q)

        const normalizeDate = (val) => {
          if (!val) return null
          if (typeof val === 'string') return parseUtcAsLocal(val)
          if (val?.toDate) return val.toDate()
          return new Date(val)
        }

        return snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            ...data,
            start: normalizeDate(data.start),
            end: normalizeDate(data.end),
          }
        })
      },
    })
  }

  // ----- CREATE -----
  const createAppointment = async (appointmentData) => {
    const authStore = useAuthStore()

    return generalApiOperation({
      operation: async () => {
        const start = appointmentData.dateTime?.start || appointmentData.dateTime
        const end = appointmentData.dateTime?.end || null

        // 🟢 1. userId визначається тільки якщо явно не переданий
        const userId = appointmentData.hasOwnProperty('userId')
          ? appointmentData.userId
          : authStore.user?.uid || null

        // 🟢 2. Нормалізатор рядків
        const normalizeStr = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null)

        let userFirstName = normalizeStr(appointmentData.firstName)
        let userLastName = normalizeStr(appointmentData.lastName)
        let phone = normalizeStr(appointmentData.phone)
        const userEmail = appointmentData.email || authStore.user?.email || null
        let finalPrice = appointmentData.price

        // 🟢 3. Якщо userId існує — підтягуємо відсутні поля з users
        if (userId) {
          const userDoc = await getDoc(doc(db, 'users', userId))
          if (userDoc.exists()) {
            const u = userDoc.data()
            if (!userFirstName) userFirstName = u.firstName || null
            if (!userLastName) userLastName = u.lastName || null
            if (!phone) phone = u.phone || null
          }
        }

        // 🟢 4. Якщо masterUserId не передано — підтягуємо з документа майстра
        let masterUserId = appointmentData.masterUserId || null
        if (!masterUserId && appointmentData.masterId) {
          const masterDoc = await getDoc(doc(db, 'masters', appointmentData.masterId))
          if (masterDoc.exists()) {
            masterUserId = masterDoc.data().userId || null
          }
        }

        // 🟢 5. Якщо ціна не передана — підтягуємо з services
        if (!finalPrice && appointmentData.serviceId) {
          const serviceDoc = await getDoc(doc(db, 'services', appointmentData.serviceId))
          if (serviceDoc.exists()) {
            const serviceData = serviceDoc.data()
            finalPrice = serviceData.price || 0
          }
        }

        // 🟢 6. Якщо duration не передана — підтягуємо з services
        let finalDuration = appointmentData.duration
        if (!finalDuration && appointmentData.serviceId) {
          const serviceDoc = await getDoc(doc(db, 'services', appointmentData.serviceId))
          if (serviceDoc.exists()) {
            const serviceData = serviceDoc.data()
            finalDuration = serviceData.duration || 60
          }
        }

        // 🟢 7. Створення документа бронювання
        await addDoc(collection(db, 'appointments'), {
          serviceId: appointmentData.serviceId,
          masterId: appointmentData.masterId, // ID документа майстра
          masterUserId, // UID користувача-майстра
          userId, // може бути null
          start,
          end,
          phone,
          userFirstName,
          userLastName,
          userEmail,
          price: appointmentData.price ?? finalPrice ?? null,
          duration: finalDuration,
          status: 'pending',
          requiresConfirmation: !!appointmentData.requiresConfirmation,
          createdAt: serverTimestamp(),
          createdBy: authStore.user?.uid || null, // хто створив бронь (адмін/майстер/клієнт)
          isSplit: !!appointmentData.isSplit,
          parentAppointmentId: appointmentData.parentAppointmentId || null,
          extraMasterBonus: appointmentData.extraMasterBonus || 0,
        })
      },
    })
  }

  // ----- CANCEL -----
  const cancelAppointment = async (appointmentId) => {
    return generalApiOperation({
      operation: async () => {
        const ref = doc(db, 'appointments', appointmentId)
        await updateDoc(ref, {
          status: 'cancelled',
          cancelledAt: serverTimestamp(),
        })
      },
    })
  }

  const updateStatus = async (appointmentId, newStatus, extraData = {}) => {
    return generalApiOperation({
      operation: async () => {
        const ref = doc(db, 'appointments', appointmentId)
        const snap = await getDoc(ref)
        if (!snap.exists()) throw new Error('Appointment not found')

        const appointment = snap.data()
        const basePrice = Number(appointment.price || 0)

        // ✅ підтримуємо і additionalCost, і extraCost
        const addCost = extraData.hasOwnProperty('additionalCost')
          ? Number(extraData.additionalCost || 0)
          : Number(extraData.extraCost || 0)

        const finalPrice = basePrice + addCost

        await updateDoc(ref, {
          status: newStatus,
          additionalCost: addCost,
          extraMasterBonus: Number(extraData.extraMasterBonus || appointment.extraMasterBonus || 0),
          finalPrice,
          comment: extraData.comment || '',
          updatedAt: serverTimestamp(),
        })
      },
    })
  }

  const rebookAppointment = async (oldAppointmentId, newAppointmentData) => {
    const authStore = useAuthStore()
    return generalApiOperation({
      operation: async () => {
        const oldRef = doc(db, 'appointments', oldAppointmentId)
        const oldSnap = await getDoc(oldRef)
        if (!oldSnap.exists()) throw new Error('Old appointment not found')

        const old = oldSnap.data()

        // --- нові дата/час
        const start = newAppointmentData.dateTime?.start || newAppointmentData.dateTime
        const end = newAppointmentData.dateTime?.end || null

        // --- ідентифікатори
        const serviceId = newAppointmentData.serviceId || old.serviceId
        const masterId = newAppointmentData.masterId || old.masterId

        // --- masterUserId
        let masterUserId = newAppointmentData.masterUserId || old.masterUserId || null
        if (!masterUserId && masterId) {
          const mDoc = await getDoc(doc(db, 'masters', masterId))
          if (mDoc.exists()) masterUserId = mDoc.data().userId || null
        }

        // --- дані користувача
        const userId = old.userId || authStore.user?.uid || null
        let userFirstName = newAppointmentData.firstName || old.userFirstName || null
        let userLastName = newAppointmentData.lastName || old.userLastName || null
        let phone = newAppointmentData.phone || old.phone || null
        const userEmail = old.userEmail || authStore.user?.email || null

        if ((!userFirstName || !userLastName || !phone) && userId) {
          const uDoc = await getDoc(doc(db, 'users', userId))
          if (uDoc.exists()) {
            const u = uDoc.data()
            userFirstName ||= u.firstName || null
            userLastName ||= u.lastName || null
            phone ||= u.phone || null
          }
        }

        // --- ціна/тривалість та requiresConfirmation
        let finalPrice = newAppointmentData.price ?? old.price ?? null
        let finalDuration = newAppointmentData.duration ?? old.duration ?? null
        let requiresConfirmation = false
        let status = 'pending'

        if (old.status === 'confirmed') {
          // якщо замовлення вже підтверджене → залишаємо підтвердженим
          status = 'confirmed'
          requiresConfirmation = false

          if ((!finalPrice || !finalDuration) && serviceId) {
            const svcDoc = await getDoc(doc(db, 'services', serviceId))
            if (svcDoc.exists()) {
              const svcData = svcDoc.data()
              finalPrice = finalPrice ?? (svcData.price || 0)
              finalDuration = finalDuration ?? (svcData.duration || 60)
            }
          }
        } else {
          // якщо ще не було підтверджене → застосовуємо логіку requiresConfirmation
          if (serviceId) {
            const svcDoc = await getDoc(doc(db, 'services', serviceId))
            if (svcDoc.exists()) {
              const svcData = svcDoc.data()
              requiresConfirmation = !!svcData.requiresConfirmation

              if (requiresConfirmation) {
                status = 'pending'
                finalPrice = null
                finalDuration = null
              } else {
                status = 'pending'
                finalPrice = finalPrice ?? (svcData.price || 0)
                finalDuration = finalDuration ?? (svcData.duration || 60)
              }
            }
          }
        }

        // --- batch: створюємо новий + скасовуємо старий
        const batch = writeBatch(db)
        const newRef = doc(collection(db, 'appointments'))

        batch.set(newRef, {
          serviceId,
          masterId,
          masterUserId,
          userId,
          start,
          end,
          phone,
          userFirstName,
          userLastName,
          userEmail,
          price: finalPrice,
          duration: finalDuration,
          status,
          requiresConfirmation,
          createdAt: serverTimestamp(),
          rebookedFrom: oldRef.id,
        })

        batch.update(oldRef, {
          status: 'cancelled',
          cancelledAt: serverTimestamp(),
          rescheduledTo: newRef.id,
        })

        await batch.commit()
        return { newId: newRef.id }
      },
    })
  }

  const updateAppointment = async (appointmentId, updatedData) => {
    return generalApiOperation({
      operation: async () => {
        const ref = doc(db, 'appointments', appointmentId)
        await updateDoc(ref, {
          ...updatedData,
          extraMasterBonus: updatedData.extraMasterBonus ?? 0,
          updatedAt: serverTimestamp(),
        })
      },
    })
  }

  const subscribeToMasterUserAppointmentsToday = (masterUserId, { year, month, day }, callback) => {
    const startOfDay = new Date(year, month, day, 0, 0, 0, 0)
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999)

    const q = query(collection(db, 'appointments'), where('masterUserId', '==', masterUserId))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // 🟢 тільки нові/активні статуси
      const notificationStatuses = ['pending', 'pendingConfirmation', 'booked']

      const results = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data()
          if (!notificationStatuses.includes(data.status || 'pending')) return null

          const start = data.start?.toDate ? data.start.toDate() : new Date(data.start)
          if (!start || isNaN(start.getTime())) return null

          if (start >= startOfDay && start <= endOfDay) {
            return { id: docSnap.id, ...data }
          }
          return null
        })
        .filter(Boolean)

      callback(results)
    })

    return unsubscribe
  }

  return {
    ...base,
    fetchByMasterAndDate,
    fetchByMasterAndRange,
    fetchByMasterUserAndDate,
    fetchByUser,
    createAppointment,
    cancelAppointment,
    updateStatus,
    rebookAppointment,
    updateAppointment,
    subscribeToMasterUserAppointmentsToday,
  }
})
