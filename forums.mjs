    document.addEventListener('DOMContentLoaded', () => {
    
    const db = firebase.firestore();
    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    const loginSection = document.getElementById('loginSection');
    const forumsSection = document.getElementById('forumsSection');
    const createForumSection = document.getElementById('createForumSection');
    const signOutButton = document.getElementById('signOut');

    document.getElementById('googleLogin').addEventListener('click', (e) => {
        e.preventDefault();
        auth.signInWithPopup(googleProvider);
    });

    document.getElementById('signOut').addEventListener('click', () => {
        auth.signOut();
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            loginSection.style.display = 'none';
            forumsSection.style.display = 'block';
            createForumSection.style.display = 'block';
            signOutButton.style.display = 'block';
            fetchForums();
        } else {
            loginSection.style.display = 'block';
            forumsSection.style.display = 'block';
            createForumSection.style.display = 'none';
            signOutButton.style.display = 'none';
        }
    });

    document.getElementById('createForumForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;

        db.collection('forums').add({
            title: title,
            description: description,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(docRef => {
            console.log('Forum created with ID:', docRef.id);
            document.getElementById('title').value = '';
            document.getElementById('description').value = '';
            fetchForums(); // Refresh the forums list
        })
        .catch(error => {
            console.error('Error adding document:', error);
        });
    });

    function fetchForums() {
        db.collection('forums').orderBy('createdAt').get().then(querySnapshot => {
            const forumsList = document.getElementById('forumsList');
            forumsList.innerHTML = '';
            querySnapshot.forEach(doc => {
                const forum = doc.data();
                forumsList.innerHTML += `<div><h2>${forum.title}</h2><p>${forum.description}</p></div>`;
            });
        });
    }
});
