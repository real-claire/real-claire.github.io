var initializeApp = require('https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js');
var getFirestore, collection, getDocs, addDoc, doc, updateDoc, arrayUnion, serverTimestamp = require('https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js');
var getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut = require('https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js');

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
            querySnapshot.forEach(forumDoc => {
                const forum = forumDoc.data();
                // Example forum display with a form to submit a post
                forumsList.innerHTML += `
                    <div id="forum_${forumDoc.id}">
                        <h2>${forum.title}</h2>
                        <p>${forum.description}</p>
                        <form onsubmit="postMessage(event, '${forumDoc.id}')">
                            <input type="text" placeholder="Write a message..." required>
                            <button type="submit">Post</button>
                        </form>
                        <div id="posts_${forumDoc.id}"></div> <!-- Posts will be inserted here -->
                    </div>
                `;
                fetchPosts(forumDoc.id);
            });
        });
    }

    window.postMessage = (event, forumId) => {
        event.preventDefault();
        const messageContent = event.target.querySelector('input').value;
        // Add document to the posts subcollection of the forum
        addDoc(collection(db, "forums", forumId, "posts"), {
            message: messageContent,
            // Include user info and timestamp
        }).then(() => {
            fetchPosts(forumId); // Refresh posts
        });
    };

    function fetchPosts(forumId) {
        // Fetch and display posts (and replies) for a given forum
    }

    // Function to submit replies to posts...
});

