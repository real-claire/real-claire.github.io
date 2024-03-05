import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
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

document.addEventListener('DOMContentLoaded', async () => {
    // Hide the form by default; it will be shown if a user is logged in
    document.getElementById('createForumForm').style.display = 'none';

    // Listen for auth state changes to toggle UI elements based on user status
    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById('createForumForm').style.display = 'block';
            document.querySelectorAll('.replyButton').forEach(el => el.style.display = 'inline-block');
        } else {
            document.getElementById('createForumForm').style.display = 'none';
            document.querySelectorAll('.replyButton').forEach(el => el.style.display = 'none');
        }
        // Fetch forums to refresh the UI based on auth state
        fetchForums();
    });
});

document.addEventListener('click', function(event) {
    if (event.target.matches('.replyButton')) {
        const postId = event.target.getAttribute('data-postId');
        displayReplyForm(postId);
    }
});

async function fetchForums() {
    const forumsContainer = document.getElementById('forumsList');
    forumsContainer.innerHTML = ''; // Clear existing content
    const forumsQuery = query(collection(db, "messages"), where("parentId", "==", null), orderBy("createdAt"));

    try {
        const querySnapshot = await getDocs(forumsQuery);
        querySnapshot.forEach(doc => {
            const message = doc.data();
            const messageElement = document.createElement('div');
            messageElement.innerHTML = `
                <div>
                    <h3>${message.title}</h3>
                    <p>${message.content}</p>
                    <small>Posted by: ${message.userName}</small>
                    ${auth.currentUser ? `<button class='replyButton' data-postId='${doc.id}'>Reply</button>` : `<p>Please sign in to reply.</p>`}
                    <div id="replies-${doc.id}"></div>
                </div>
            `;
            forumsContainer.appendChild(messageElement);

            // Fetch replies for this message
            fetchReplies(doc.id);
        });
    } catch (error) {
        console.error("Error fetching forums: ", error);
    }
}

async function fetchReplies(parentId, level = 0) {
    const repliesContainerId = `replies-${parentId}`;
    let repliesContainer = document.getElementById(repliesContainerId);

    // Ensuring the replies container is present
    if (!repliesContainer) {
        repliesContainer = document.createElement('div');
        repliesContainer.id = repliesContainerId;
        document.querySelector(`[data-postId='${parentId}']`).parentNode.appendChild(repliesContainer);
    }

    const repliesQuery = query(collection(db, "messages"), where("parentId", "==", parentId), orderBy("createdAt"));

    try {
        const querySnapshot = await getDocs(repliesQuery);
        querySnapshot.forEach(doc => {
            const reply = doc.data();
            const replyElement = document.createElement('div');
            replyElement.classList.add('reply');
            replyElement.style.marginLeft = `${level * 20}px`; // Visually indent replies
            replyElement.innerHTML = `
                <p>${reply.content}</p>
                <small>Replied by: ${reply.userName}</small>
                ${auth.currentUser ? `<button class='replyButton' data-postId='${doc.id}'>Reply</button>` : ''}
                <div id="replies-${doc.id}"></div>
            `;
            repliesContainer.appendChild(replyElement);

            // Recursively fetch further nested replies
            fetchReplies(doc.id, level + 1);
        });
    } catch (error) {
        console.error("Error fetching replies: ", error);
    }
}

function displayReplyForm(parentId, level = 0) {
    const replyFormId = `replyForm-${parentId}`;
    let replyForm = document.getElementById(replyFormId);

    // If the reply form doesn't exist, create it and append it to the parent post or reply
    if (!replyForm) {
        replyForm = document.createElement('form');
        replyForm.id = replyFormId;
        replyForm.classList.add('replyForm');
        replyForm.innerHTML = `
            <input type="text" class="replyInput" placeholder="Your reply..." required>
            <button type="submit">Submit Reply</button>
        `;
        // Ensure the form submission calls `submitReply` with proper parameters
        replyForm.onsubmit = async (event) => {
            event.preventDefault();
            await submitReply(event, parentId);
            replyForm.style.display = 'none'; // Optional: Hide after submitting
        };

        // Determine the correct container for this reply form based on parentId
        let parentContainer = document.getElementById(`replies-${parentId}`);
        if (!parentContainer) {
            // If there's no replies container, append directly to the post's main div
            parentContainer = document.getElementById(`post_${parentId}`);
        }

        // Append the form and ensure it's visible
        parentContainer.appendChild(replyForm);
    } else {
        // If the form already exists, just ensure it's visible (for repeated replies without page refresh)
        replyForm.style.display = 'block';
    }

    // Focus on the input field when displaying the form for a better user experience
    replyForm.querySelector('.replyInput').focus();
}


async function submitReply(event, parentId) {
    event.preventDefault();
    if (!auth.currentUser) {
        alert("Please log in to reply.");
        return;
    }

    const form = event.currentTarget;
    const replyContent = form.querySelector('input[type="text"]').value;

    try {
        await addDoc(collection(db, "messages"), {
            content: replyContent,
            parentId: parentId,
            userName: auth.currentUser.displayName,
            userProfilePic: auth.currentUser.photoURL || 'default_profile_pic_url.jpg',
            createdAt: serverTimestamp()
        });
        console.log("Reply successfully added!");
        form.reset();
        await fetchReplies(parentId); // Refresh to show the new reply
    } catch (error) {
        console.error("Error submitting reply: ", error);
    }
}

function signIn() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).then((result) => {
        console.log("User signed in");
        // Optionally refresh or dynamically update the UI post-login
    }).catch(error => console.error("Error signing in: ", error.message));
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('createForumForm').style.display = 'block';
        [...document.querySelectorAll('.replyButton')].forEach(btn => btn.style.display = 'inline-block');
    } else {
        document.getElementById('createForumForm').style.display = 'none';
        [...document.querySelectorAll('.replyButton')].forEach(btn => btn.style.display = 'none');
    }
    // Re-fetch forums to refresh the UI based on auth state
    fetchForums();
});

