import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
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
    document.getElementById('createForumForm').style.display = 'none'; // Hide the form
    document.getElementById('createForumForm').addEventListener('submit', postForum); // Add event listener

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
    
    document.getElementById('authButton').addEventListener('click', signIn);
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

    try {
        const forumsQuery = query(collection(db, "messages"), where("parentId", "==", null), orderBy("createdAt"));
        const querySnapshot = await getDocs(forumsQuery);

        querySnapshot.forEach(doc => {
            const message = doc.data();
            // Assign an ID to each forum post container for later reference
            const postId = `post-${doc.id}`;
            const messageElement = document.createElement('div');
            messageElement.setAttribute('id', postId); // Important for associating replies
            messageElement.innerHTML = `
                <div>
                    <img src="${message.userProfilePic || 'default_avatar.png'}" alt="User profile picture" class="user-pic">
                    <div class="text-container">
                    <span>${message.userName.split(' ')[0]}</span> <!-- First name -->
                    <small>${formatDate(message.createdAt)}</small>
                    <h2 class="thread-title">${message.title}</h2>
                    <p>${message.content}</p>
                    <p class="line"></p>
                    </div>
                </div>
                <div class="replies" id="replies-${doc.id}"></div> <!-- Container for replies -->
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
            <div class="nestedReply">
                <img src="${reply.userProfilePic || 'default_avatar.png'}" alt="User profile picture" class="user-pic">
                <h3 display:inline-block>${reply.userName.split(' ')[0]}</h3>
                <small>· ${formatDate(reply.createdAt)}</small>
            </div>
                <p>${reply.content}</p>

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
        <div>
            <input type="text" class="replyInput" placeholder="Your reply..." required>
            <button type="submit">Submit Reply</button>
        </div>
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

// Example of a postForum function
async function postForum(event) {
    event.preventDefault(); // Prevent the form from submitting in the traditional way

    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;

    if (!title || !content) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        await addDoc(collection(db, "messages"), {
            title,
            content,
            userName: auth.currentUser.displayName,
            userProfilePic: auth.currentUser.photoURL,
            parentId: null, // Indicating this is a top-level post
            createdAt: serverTimestamp()
        });
        console.log("Thread successfully posted!");
        document.getElementById('title').value = '';
        document.getElementById('content').value = '';
        fetchForums(); // Refresh the list of forums
    } catch (error) {
        console.error("Error posting thread: ", error);
        alert("Failed to post the thread.");
    }
}

document.getElementById('createForumForm')?.addEventListener('submit', postForum);


// Example signIn function
function signIn() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("User signed in");
            // Update UI or redirect as necessary
        })
        .catch((error) => {
            console.error("Error signing in: ", error);
            alert("Failed to sign in.");
        });
}

function signOutUser() {
    signOut(auth).then(() => {
        console.log("User signed out successfully");
        // Optionally, redirect the user or provide a notification
    }).catch((error) => {
        console.error("Error signing out: ", error);
        alert("Failed to sign out.");
    });
}

function formatDate(timestamp) {
    const date = timestamp.toDate(); // Convert Firestore timestamp to JavaScript Date object
    const now = new Date();
    const secondsAgo = Math.round((now - date) / 1000);
    const minutesAgo = Math.round(secondsAgo / 60);
    const hoursAgo = Math.round(minutesAgo / 60);
    const daysAgo = Math.round(hoursAgo / 24);
    const weeksAgo = Math.round(daysAgo / 7);
    const monthsAgo = Math.round(daysAgo / 30);
    const yearsAgo = Math.round(daysAgo / 365);

    if (secondsAgo < 60) {
        return 'just now';
    } else if (minutesAgo < 60) {
        return `${minutesAgo} min ago`;
    } else if (hoursAgo < 24) {
        return `${hoursAgo} hours ago`;
    } else if (daysAgo < 7) {
        return `${daysAgo} days ago`;
    } else if (weeksAgo < 5) {
        return `${weeksAgo} weeks ago`;
    } else if (monthsAgo < 12) {
        return `${monthsAgo} months ago`;
    } else {
        return `${yearsAgo} years ago`;
    }
}



onAuthStateChanged(auth, (user) => {
    const userInfo = document.getElementById('userInfo');
    const authButton = document.getElementById('authButton');

    if (user) {
        // Display user info and change button to "Log Out"
        const userPic = document.getElementById('userPic');
        const userName = document.getElementById('userName');

        userPic.src = user.photoURL || 'default_avatar.png'; // Use a default avatar if the user doesn't have a photoURL
        userName.textContent = `Hello, ${user.displayName.split(' ')[0]}`; // Assuming the displayName format is "First Last"

        userInfo.style.display = 'block';
        authButton.textContent = 'Log Out';
        authButton.removeEventListener('click', signIn);
        authButton.addEventListener('click', signOutUser);

        document.getElementById('createForumForm').style.display = 'block';
    } else {
        // Hide user info and change button to "Sign In"
        userInfo.style.display = 'none';
        authButton.textContent = 'Sign In';
        authButton.removeEventListener('click', signOutUser);
        authButton.addEventListener('click', signIn);

        document.getElementById('createForumForm').style.display = 'none';
    }
});

await addDoc(collection(db, "messages"), {
    content: replyContent,
    parentId: parentId,
    userName: auth.currentUser.displayName,
    userProfilePic: auth.currentUser.photoURL,
    createdAt: serverTimestamp(), // Ensure this is included when adding a doc
});