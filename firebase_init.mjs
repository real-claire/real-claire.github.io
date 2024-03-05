const firebaseConfig = {
    apiKey: "AIzaSyCNg0dn4mTW4E489OkRxwvXAzr25qOMS1M",
    authDomain: "portfolio-forum-cce27.firebaseapp.com",
    projectId: "portfolio-forum-cce27",
    storageBucket: "portfolio-forum-cce27.appspot.com",
    messagingSenderId: "200834829160",
    appId: "1:200834829160:web:a97c64807874a4aa4c24dd",
  };
  
// Initialize Firebase
initializeApp(firebaseConfig);
const db = firebase.firestore();
const userUI = document.getElementById("userUI");
const loginPrompt = document.getElementById("loginPrompt");

document.getElementById("createForumForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;

  db.collection("forums").add({
    title: title,
    description: description,
    createdAt: firebase.FieldValue.serverTimestamp()
  })
  .then((docRef) => {
    console.log("Forum created with ID: ", docRef.id);
    // Redirect to forums list or clear form
  })
  .catch((error) => {
    console.error("Error adding document: ", error);
  });
});

document.getElementById("googleLogin").addEventListener("click", function(e) {
    e.preventDefault(); // Prevent default action
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then(function(result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const token = result.credential.accessToken;
        // The signed-in user info.
        const user = result.user;
        // Redirect to forums or another page after successful login
        window.location.href = 'forums.html';
    }).catch(function(error) {
        // Handle Errors here.
        console.error("Error signing in: ", error.message);
    });
    });

    firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        window.location.href = 'forums.html'; // Redirect if already logged in
    }
});

function fetchForums() {
    db.collection("forums").get().then((querySnapshot) => {
        const forumsList = document.getElementById("forumsList");
        forumsList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const forum = doc.data();
            forumsList.innerHTML += `<div><h2>${forum.title}</h2><p>${forum.description}</p></div>`;
        div
        });
    });
}
document.getElementById("signOut").addEventListener("click", function() {
    firebase.auth().signOut().then(() => {
    console.log("User signed out.");
    window.location.reload();
    });
});

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
    // User is signed in, show forum creation UI and hide login prompt
    userUI.style.display = "block";
    loginPrompt.style.display = "none";
    } else {
    // No user is signed in, hide forum creation UI and show login prompt
    userUI.style.display = "none";
    loginPrompt.style.display = "block";
    }
});

fetchForums();

document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();

    document.getElementById("googleLogin").addEventListener("click", function(e) {
        e.preventDefault(); // Corrected: Prevent default action
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then(function(result) {
            // User logged in, redirect or handle logged-in UI
            window.location.href = 'forums.html';
        }).catch(function(error) {
            console.error("Error signing in: ", error.message);
        });
    });

    document.getElementById("signOut").addEventListener("click", function() {
        auth.signOut().then(() => {
            console.log("User signed out.");
            window.location.reload();
        });
    });

    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in, adjust UI accordingly
            document.getElementById("userUI").style.display = "block";
            document.getElementById("loginPrompt").style.display = "none";
            // Optionally display user info
            console.log(`Logged in as ${user.email}`);
        } else {
            // No user is signed in
            document.getElementById("userUI").style.display = "none";
            document.getElementById("loginPrompt").style.display = "block";
        }
    });

    // Assuming createForumForm is within userUI and only visible when logged in
    document.getElementById("createForumForm").addEventListener("submit", function(e) {
        e.preventDefault();
        const title = document.getElementById("title").value;
        const description = document.getElementById("description").value;

        const db = firebase.firestore();
        db.collection("forums").add({
            title: title,
            description: description,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then((docRef) => {
            console.log("Forum created with ID: ", docRef.id);
            // Clear form, refresh forums list, or show success message
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
        });
    });

    fetchForums();
});

  