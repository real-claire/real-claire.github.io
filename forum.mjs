import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, arrayUnion, serverTimestamp  } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
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

    async function fetchPosts(forumId) {
        const postsList = document.getElementById(`posts_${forumId}`);
        postsList.innerHTML = ''; // Clear existing posts
    
        const postsSnapshot = await getDocs(collection(db, "forums", forumId, "posts"));
        postsSnapshot.forEach(postDoc => {
            const post = postDoc.data();
            // Structure to display each post and its replies
            const postElement = document.createElement('div');
            postElement.innerHTML = `
                <p>${post.message}</p>
                <div>Posted by: <img src="${post.userProfilePic || 'img.jpg'}" alt="User" style="width:20px;height:20px;border-radius:50%;"> ${post.userName}</div>
                <button onclick="toggleReplyForm('${postDoc.id}')">Reply</button>
                <div id="replies_${postDoc.id}"></div> <!-- Placeholder for replies -->
                <form id="replyForm_${postDoc.id}" style="display:none;" onsubmit="postReply(event, '${forumId}', '${postDoc.id}')">
                    <input type="text" placeholder="Reply..." required>
                    <button type="submit">Send Reply</button>
                </form>
            `;
            postsList.appendChild(postElement);
    
            // Fetch replies for this post
            fetchReplies(forumId, postDoc.id);
        });
    }

    function toggleReplyForm(postId) {
        const replyForm = document.getElementById(`replyForm_${postId}`);
        replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
    }
    

    async function postForum(event) {
        event.preventDefault(); // Prevent default form submission behavior
        const titleInput = document.getElementById('title');
        const descriptionInput = document.getElementById('description');
    
        try {
            await addDoc(collection(db, "forums"), {
                title: titleInput.value,
                description: descriptionInput.value,
                // Include additional data here as needed
                createdAt: serverTimestamp() // Use serverTimestamp for consistency
            });
            console.log("Forum successfully created!");
            titleInput.value = ''; // Clear the form fields after submission
            descriptionInput.value = '';
            fetchForums(); // Re-fetch forums to display the newly added one
        } catch (error) {
            console.error("Error creating forum: ", error);
        }
    }
    // Function to submit replies to posts...
    async function postReply(event, forumId, postId) {
        event.preventDefault();
        const replyInput = event.target.querySelector('input');
        const replyContent = replyInput.value;
    
        try {
            await addDoc(collection(db, "forums", forumId, "posts", postId, "replies"), {
                message: replyContent,
                userName: auth.currentUser.displayName.split(' ')[0],
                userProfilePic: auth.currentUser.photoURL,
                createdAt: serverTimestamp()
            });
            console.log("Reply successfully added!");
            replyInput.value = ''; // Clear input after posting
            fetchReplies(forumId, postId); // Refresh replies
        } catch (error) {
            console.error("Error adding reply: ", error);
        }
    }
    
    async function fetchReplies(forumId, postId) {
        const repliesList = document.getElementById(`replies_${postId}`);
        repliesList.innerHTML = ''; // Clear existing replies
    
        const repliesSnapshot = await getDocs(collection(db, "forums", forumId, "posts", postId, "replies"));
        repliesSnapshot.forEach(replyDoc => {
            const reply = replyDoc.data();
            const replyElement = document.createElement('div');
            replyElement.innerHTML = `
                <p>${reply.message}</p>
                <div>Replied by: <img src="${reply.userProfilePic || 'img.jpg'}" alt="User" style="width:15px;height:15px;border-radius:50%;"> ${reply.userName}</div>
            `;
            repliesList.appendChild(replyElement);
        });
    }
    window.postForum = postForum;

});

