import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import { getFirestore, collection, getDocs, addDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyCNg0dn4mTW4E489OkRxwvXAzr25qOMS1M",
    authDomain: "portfolio-forum-cce27.firebaseapp.com",
    projectId: "portfolio-forum-cce27",
    storageBucket: "portfolio-forum-cce27.appspot.com",
    messagingSenderId: "200834829160",
    appId: "1:200834829160:web:a97c64807874a4aa4c24dd",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    const authButton = document.createElement('button');
    authButton.style.position = 'absolute';
    authButton.style.top = '20px';
    authButton.style.right = '20px';
    document.body.appendChild(authButton);

    function updateAuthButton(user) {
        if (user) {
            authButton.textContent = 'Sign Out';
            document.getElementById('createForumSection').style.display = 'block';
            document.getElementById('userInfo').style.display = 'block';
            document.getElementById('userPic').src = user.photoURL || 'img.jpg'; // Fallback to a default image
            document.getElementById('userName').textContent = `Hello, ${user.displayName.split(' ')[0]}!`;
        } else {
            authButton.textContent = 'Sign In';
            document.getElementById('createForumSection').style.display = 'none';
            document.getElementById('userInfo').style.display = 'none';
        }
    }

    authButton.addEventListener('click', () => {
        if (authButton.textContent === 'Sign In') {
            const provider = new GoogleAuthProvider();
            signInWithPopup(auth, provider).catch(error => {
                console.error("Error signing in: ", error.message);
            });
        } else {
            signOut(auth);
        }
    });

    onAuthStateChanged(auth, user => {
        updateAuthButton(user);
        fetchForums();
    });

    function fetchForums() {
        getDocs(collection(db, "forums")).then(querySnapshot => {
            const forumsList = document.getElementById('forumsList');
            forumsList.innerHTML = '';
            querySnapshot.forEach(doc => {
                const forum = doc.data();
                forumsList.innerHTML += `<div><h2>${forum.title}</h2><p>${forum.description}</p></div>`;
            });
        });
    }
});

