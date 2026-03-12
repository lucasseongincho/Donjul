import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, enableIndexedDbPersistence } from 'firebase/firestore';
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
enableIndexedDbPersistence(db).catch(() => {});

// Fix #4: per-user timers so a fast user-switch never drops or misroutes a save
const _saveTimers = new Map();
export const save = (uid, data, onComplete) => {
  clearTimeout(_saveTimers.get(uid));
  _saveTimers.set(uid, setTimeout(() => {
    _saveTimers.delete(uid);
    setDoc(doc(db, "user_data", uid), { data: JSON.stringify(data) })
      .then(onComplete)
      .catch(() => {});
  }, 400));
};
