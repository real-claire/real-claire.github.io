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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('createForumForm').style.display = 'none';
    document.getElementById('createForumForm').addEventListener('submit', postForum);

    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById('createForumForm').style.display = 'block';
            document.querySelectorAll('.replyButton').forEach(el => el.style.display = 'inline-block');
        } else {
            document.getElementById('createForumForm').style.display = 'none';
            document.querySelectorAll('.replyButton').forEach(el => el.style.display = 'none');
        }
        fetchForums();
    });

    const sortOrderSelect = document.getElementById('sortOrderSelect');
    if (sortOrderSelect) {
        sortOrderSelect.addEventListener('change', function() {
            const selectedSortOrder = this.value;
            fetchForums(selectedSortOrder);
        });
    } else {
        console.error('sortOrderSelect element not found.');
    }

    document.getElementById('authButton').addEventListener('click', signIn);

    document.addEventListener('click', function(event) {
        if (event.target.matches('.replyButton')) {
            const postId = event.target.getAttribute('data-postId');
            displayReplyForm(postId);
        } else if (event.target.matches('.commentButton')) {
            const postId = event.target.getAttribute('data-postId');
            const replyContent = event.target.previousElementSibling.value;
            if (replyContent.trim()) {
                submitReplyToThread(postId, replyContent, event.target);
            }
        }
    });
});

async function fetchForums(sortOrder = 'desc') {
    const forumsContainer = document.getElementById('forumsList');
    forumsContainer.innerHTML = '';

    try {
        let forumsQuery = query(collection(db, "messages"), 
                            where("parentId", "==", null), 
                            orderBy("createdAt", sortOrder));        
        const querySnapshot = await getDocs(forumsQuery);

        if (querySnapshot.empty) {
            forumsContainer.innerHTML = '<p>No threads to display.</p>';
            return;
        }

        querySnapshot.forEach(doc => {
            const message = doc.data();
            const postId = `post-${doc.id}`;
            const messageElement = document.createElement('div');
            const replyBoxHTML = auth.currentUser ? `
                <div class="replyBox">
                    <textarea class="replyInput" placeholder="Your reply..." required></textarea>
                    <button class="commentButton" data-postId="${doc.id}">Comment</button>
                </div>
            ` : '';
            messageElement.setAttribute('id', postId);
            messageElement.innerHTML = `
                <div>
                    <img src="${message.userProfilePic || 'default_avatar.png'}" alt="User profile picture" class="user-pic">
                    <div class="text-container">
                    <span>${message.userName.split(' ')[0]}</span> <!-- First name -->
                    <small>${formatDate(message.createdAt)}</small>
                    <h2 class="thread-title">${message.title}</h2>
                    <p>${message.content}</p>
                    <p class="line"></p>
                    <p>${replyBoxHTML}</p>
                    </div>
                </div>
                
                <div class="replies" id="replies-${doc.id}"></div> <!-- Container for replies -->
            `;
            forumsContainer.appendChild(messageElement);

            fetchReplies(doc.id);
        });
    } catch (error) {
        console.error("Error fetching forums: ", error);
        forumsContainer.innerHTML = '<p>oops, i may have messed up the code</p>';
    }
}

async function fetchReplies(parentId, level = 0) {
    const repliesContainerId = `replies-${parentId}`;
    let repliesContainer = document.getElementById(repliesContainerId);
    repliesContainer.innerHTML = '';

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
            replyElement.style.marginLeft = `${level + 20}px`;
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

function displayReplyForm(postId, level = 0) {
    const replyFormId = `replyForm-${postId}`;
    let replyForm = document.getElementById(replyFormId);

    if (!replyForm) {
        const formContainer = document.createElement('div');
        formContainer.id = replyFormId;
        formContainer.classList.add('replyForm');
        formContainer.innerHTML = `
            <form>
                <textarea class="replyInput" placeholder="Your reply..." required></textarea>
                <div class="form-actions">
                    <button type="submit" class="submitReply">Submit Reply</button>
                    <button type="button" class="cancelReply">Cancel</button>
                </div>
            </form>
        `;
    
        let parentContainer = document.getElementById(`replies-${postId}`) || document.getElementById(`post-${postId}`);
        parentContainer.appendChild(formContainer);
        
        formContainer.style.display = 'block';
        formContainer.querySelector('.replyInput').focus();
        formContainer.querySelector('.cancelReply').onclick = () => closeReplyForm(form);

        const form = formContainer.querySelector('form');
        form.onsubmit = async (event) => await submitReply(event, postId, form);
        form.reset();
    } else {
        replyForm.style.display = 'block';
        replyForm.querySelector('.replyInput').focus();
    }
}    

function closeReplyForm(form) {
    form.style.display = 'none';
    form.reset();
}

async function submitReply(event, parentId, form) {
    event.preventDefault();
    if (!auth.currentUser) {
        alert("Please log in to reply.");
        return;
    }

    const replyContent = form.querySelector('.replyInput').value;
    
    if (replyContent.trim() === "") {
        alert("Reply cannot be empty.");
        return;
    }

    try {
        await addDoc(collection(db, "messages"), {
            content: replyContent,
            parentId: parentId,
            userName: auth.currentUser.displayName,
            userProfilePic: auth.currentUser.photoURL || 'default_profile_pic_url.jpg',
            createdAt: serverTimestamp(),
        });
        console.log("Reply successfully added!");
        form.reset();
        form.style.display = 'none'; // Ensure form is correctly targeted for hiding
        await fetchReplies(parentId);
    } catch (error) {
        console.error("Error submitting reply: ", error);
    }
    fetchReplies(parentId);
}

async function submitReplyToThread(postId, replyContent) {
    try {
        await addDoc(collection(db, "messages"), {
            content: replyContent,
            parentId: postId,
            userName: auth.currentUser.displayName,
            userProfilePic: auth.currentUser.photoURL || 'default_avatar.png',
            createdAt: serverTimestamp(),
        });
        console.log("Reply to thread successfully added!");
        // Clear the input field after posting
        document.querySelector(`[data-postId="${postId}"]`).previousElementSibling.value = '';
        fetchReplies(postId);
    } catch (error) {
        console.error("Error submitting reply to thread: ", error);
    }

}

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
    }).catch((error) => {
        console.error("Error signing out: ", error);
        alert("Failed to sign out.");
    });
}

function formatDate(timestamp) {
    const date = timestamp.toDate();
    const now = new Date();
    const secondsAgo = Math.round((now - date) / 1000);

    const timeUnits = [
        { unit: "year", seconds: 31536000 },
        { unit: "month", seconds: 2592000 },
        { unit: "week", seconds: 604800 },
        { unit: "day", seconds: 86400 },
        { unit: "hour", seconds: 3600 },
        { unit: "min", seconds: 60 },
    ];

    for (let {unit, seconds} of timeUnits) {
        const count = Math.floor(secondsAgo / seconds);
        if (count >= 1) {
            return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
        }
    }

    return 'just now';
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