import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInAnonymously,
    signInWithCustomToken,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    arrayUnion,
    onSnapshot
} from 'firebase/firestore';

// --- Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyBG1uPRdilWM5LuTEe42ElmF9hljJH0Q8U",
    authDomain: "remi-1e5ca.firebaseapp.com",
    projectId: "remi-1e5ca",
    storageBucket: "remi-1e5ca.firebasestorage.app",
    messagingSenderId: "181320802161",
    appId: "1:181320802161:web:4a358015b36abf7eaea0d0",
    measurementId: "G-DM31SX7NHT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const APP_ID = 'remi-guitar-tutor';

// --- User Data Factory ---
const createInitialData = () => ({ xp: 0, streak: 1, completedLessons: [] });

// --- Auth Helpers ---
export const signIn = async (token) => {
    try {
        if (token) return await signInWithCustomToken(auth, token);
        return await signInAnonymously(auth);
    } catch (e) {
        console.warn("Firebase Auth Failed (Network/Config). Falling back to Offline Mode.", e);
        return { uid: 'offline_user', isAnonymous: true };
    }
};

export const registerUser = async (email, password) => {
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        return cred.user;
    } catch (e) {
        console.error("Registration Error", e);
        throw e;
    }
};

export const loginUser = async (email, password) => {
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        return cred.user;
    } catch (e) {
        console.error("Login Error", e);
        throw e;
    }
};

export const logoutUser = async () => {
    return await signOut(auth);
};

// --- Firestore Helpers (With Local Fallback) ---
export const subscribeToUserProgress = (userId, callback) => {
    // Offline / Fallback
    if (userId === 'offline_user' || !auth.currentUser) {
        console.log("Using Local Storage for Progress (Offline/Guest)");
        const saved = localStorage.getItem(`remi_progress_${userId}`);
        const data = saved ? JSON.parse(saved) : createInitialData();
        callback(data);
        return () => { }; // no-op unsubscribe
    }

    try {
        const docRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'data', 'progress');
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Backup to local
                localStorage.setItem(`remi_progress_${userId}`, JSON.stringify(data));
                callback(data);
            } else {
                setDoc(docRef, createInitialData());
                callback(createInitialData());
            }
        }, (err) => {
            console.warn("Firestore access denied. Falling back to Local Storage.", err);
            const saved = localStorage.getItem(`remi_progress_${userId}`);
            callback(saved ? JSON.parse(saved) : createInitialData());
        });
    } catch (e) {
        console.error("Firestore Error", e);
        const saved = localStorage.getItem(`remi_progress_${userId}`);
        callback(saved ? JSON.parse(saved) : createInitialData());
        return () => { };
    }
};

export const updateUserProgress = async (userId, currentProgress, lessonId, xpEarned) => {
    const newData = {
        xp: (currentProgress?.xp || 0) + xpEarned,
        completedLessons: [...(currentProgress?.completedLessons || []), lessonId],
        streak: currentProgress?.streak || 1
    };

    // Always save to local storage as backup (NAMESPACED)
    localStorage.setItem(`remi_progress_${userId}`, JSON.stringify(newData));

    if (userId === 'offline_user') return newData;

    try {
        const docRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'data', 'progress');
        // Use set with merge to be safe against missing docs
        await setDoc(docRef, {
            xp: newData.xp,
            completedLessons: arrayUnion(lessonId)
        }, { merge: true });
    } catch (e) {
        console.warn("Could not sync to cloud (Permissions/Net). Saved locally.", e);
    }

    return newData;
};
