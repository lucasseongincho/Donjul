import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC8BPVZ1d93kRk2d5hKSGAZTDMDr-lhmSM",
  authDomain: "fintracker-7d604.firebaseapp.com",
  projectId: "fintracker-7d604",
  storageBucket: "fintracker-7d604.firebasestorage.app",
  messagingSenderId: "281705778764",
  appId: "1:281705778764:web:89aca41cf49715450b6ee9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

let _saveTimer = null;
export const save = (uid, data) => {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    setDoc(doc(db, "user_data", uid), { data: JSON.stringify(data) }).catch(() => { });
  }, 400);
};
