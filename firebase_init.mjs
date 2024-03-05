const firebaseConfig = {
    apiKey: "AIzaSyCNg0dn4mTW4E489OkRxwvXAzr25qOMS1M",
    authDomain: "portfolio-forum-cce27.firebaseapp.com",
    projectId: "portfolio-forum-cce27",
    storageBucket: "portfolio-forum-cce27.appspot.com",
    messagingSenderId: "200834829160",
    appId: "1:200834829160:web:a97c64807874a4aa4c24dd",
  };
  
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const userUI = document.getElementById("userUI");
const loginPrompt = document.getElementById("loginPrompt");

document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById("createForumForm");
    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            const title = document.getElementById("title").value;
            const description = document.getElementById("description").value;

            db.collection("forums").add({
                title: title,
                description: description,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then((docRef) => {
                console.log("Forum created with ID: ", docRef.id);
                // Actions after successful creation
            })
            .catch((error) => {
                console.error("Error adding document: ", error);
            });
        });
    } else {
        console.log("Form element not found.");
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const userUI = document.getElementById("userUI");
    const loginPrompt = document.getElementById("loginPrompt");
    
    document.getElementById("googleLogin")?.addEventListener("click", function(e) {
        e.preventDefault();
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).then(function(result) {
            window.location.href = 'forums.html';
        }).catch(function(error) {
            console.error("Error signing in: ", error.message);
        });
    });

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            window.location.href = 'forums.html'; 
        }
    });

    function fetchForums() {
        db.collection("forums").get().then((querySnapshot) => {
            const forumsList = document.getElementById("forumsList");
            forumsList.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const forum = doc.data();
                forumsList.innerHTML += `<div><h2>${forum.title}</h2><p>${forum.description}</p></div>`;
            });
        });
    }
    
    document.getElementById("signOut")?.addEventListener("click", function() {
        firebase.auth().signOut().then(() => {
            console.log("User signed out.");
            window.location.reload();
        });
    });

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            userUI.style.display = "block";
            loginPrompt.style.display = "none";
        } else {
            userUI.style.display = "none";
            loginPrompt.style.display = "block";
        }
    });

    fetchForums();

    const createForumForm = document.getElementById("createForumForm");
    if (createForumForm) {
        createForumForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const title = document.getElementById("title").value;
            const description = document.getElementById("description").value;

            db.collection("forums").add({
                title: title,
                description: description,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then((docRef) => {
                console.log("Forum created with ID: ", docRef.id);
                // Optionally, clear the form or redirect
            })
            .catch((error) => {
                console.error("Error adding document: ", error);
            });
        });
            fetchForums();
        }
    });