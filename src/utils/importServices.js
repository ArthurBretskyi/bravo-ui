// ======================================додаємо один сервіс до БД

// src/utils/importServices.js

// import { doc, setDoc } from 'firebase/firestore'
// import db from '@/firebase-config'
// // import dyeingData from '@/assets/dyeing_firestore_doc.json'
// // import piercingData from '@/assets/piercing_firestore_doc.json'
// import haircutsData from '@/assets/haircuts_firestore_doc.json'

// export async function importHaircutsService() {
//   try {
//     console.log('⏳ Import start...')
//     await setDoc(doc(db, 'services', 'haircuts'), haircutsData, { merge: true })
//     console.log("✅ Import finished! Document 'haircuts' created in 'services'")
//   } catch (error) {
//     console.error('❌ Import error:', error)
//   }
// }

// ===================================додаємо одразу декілька сервісів до БД

// src/utils/importServices.js
// import { doc, setDoc } from 'firebase/firestore'
// import db from '@/firebase-config'

// Імпортуємо JSON файли
// import dyeingData from '@/assets/dyeing_firestore_doc.json'
// import solariumData from '@/assets/solarium_firestore_doc.json'
// import manicureData from '@/assets/manicure_firestore_doc.json'
// import haircutsData from '@/assets/haircuts_firestore_doc.json'
// import manicurPedicureData from '@/assets/manicure_pedicure_firestore_doc.json'

// // Список сервісів, які хочемо завантажити
// const servicesToImport = [
//   //   { id: 'dyeing', data: dyeingData },
//   //   { id: 'solarium', data: solariumData },
//   //   { id: 'manicure', data: manicureData },
// //   { id: 'haircuts', data: haircutsData },
//   //   { id: 'manicure_pedicure', data: manicurPedicureData },
// ]

// export async function importAllServices() {
//   try {
//     console.log('⏳ Import start...')
//     for (const service of servicesToImport) {
//       await setDoc(doc(db, 'services', service.id), service.data)
//       console.log(`✅ Service '${service.id}' imported successfully`)
//     }
//     console.log('🎉 All services imported!')
//   } catch (error) {
//     console.error('❌ Import error:', error)
//   }
// }
