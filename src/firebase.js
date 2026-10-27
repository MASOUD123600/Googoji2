import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// کلید وب Firebase ذاتاً عمومی است؛ امنیت با firestore.rules تأمین می‌شود
const firebaseConfig = {
  apiKey: "AIzaSyD4PHoP3O2-MZiB_d1Ryt1Rs2iobViuNas",
  authDomain: "googoji-ae717.firebaseapp.com",
  projectId: "googoji-ae717",
  storageBucket: "googoji-ae717.firebasestorage.app",
  messagingSenderId: "51033389121",
  appId: "1:51033389121:web:a7e3aa6c0c60cc95062ec0",
  measurementId: "G-JG2GBE5C5F",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
