// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyASCRfOoLWl7ojLBuHhrJ1BRVnt5jWRFk8",
    authDomain: "android-app-a19e4.firebaseapp.com",
    projectId: "android-app-a19e4",
    storageBucket: "android-app-a19e4.appspot.com",
    messagingSenderId: "348425545203",
    appId: "1:348425545203:web:81cf772d5786a60a8e1e86"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
