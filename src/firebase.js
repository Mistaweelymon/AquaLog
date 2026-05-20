import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyC5m1HmL-04XUYiGK5bt7nCIa0nqO1y8Ak",
  authDomain: "aqualog-688e3.firebaseapp.com",
  projectId: "aqualog-688e3",
  storageBucket: "aqualog-688e3.firebasestorage.app",
  messagingSenderId: "144392086540",
  appId: "1:144392086540:web:27b6fa29273dab2411ba29"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)