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

    document.addEventListener('click', function(event) {
        if (event.target.matches('.replyButton')) {
            const postId = event.target.getAttribute('data-postId');
            displayReplyForm(postId);
        }
    });

    // Check if sortOrderSelect exists before adding event listener
    const sortOrderSelect = document.getElementById('sortOrderSelect');
    if (sortOrderSelect) {
        sortOrderSelect.addEventListener('change', function() {
            const selectedSortOrder = this.value;
            fetchForums(selectedSortOrder); // Fetch forums with the selected sort order
        });
    } else {
        console.error('sortOrderSelect element not found.');
    }

    document.getElementById('authButton').addEventListener('click', signIn);

    document.addEventListener('click', function(event) {
        if (event.target.matches('.commentButton')) {
            const postId = event.target.getAttribute('data-postId');
            const replyContent = event.target.previousElementSibling.value; // Assuming the text area is directly before the button
            if (replyContent.trim()) {
                submitReplyToThread(postId, replyContent);
            }
        }
    });
    
});

async function fetchForums(sortOrder = 'desc') {
    const forumsContainer = document.getElementById('forumsList');
    forumsContainer.innerHTML = ''; // Clear existing content

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
            // Assign an ID to each forum post container for later reference
            const postId = `post-${doc.id}`;
            const messageElement = document.createElement('div');
            const replyBoxHTML = auth.currentUser ? `
                <div class="replyBox">
                    <textarea class="replyInput" placeholder="Your reply..." required></textarea>
                    <button class="commentButton" data-postId="${doc.id}">Comment</button>
                </div>
            ` : '';
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
                    <p>${replyBoxHTML}</p>
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
        forumsContainer.innerHTML = '<p>oops, i may have messed up the code</p>';
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
            replyElement.style.marginLeft = `${level + 20}px`; // Visually indent replies
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
        const formContainer = document.createElement('div'); // This is the container div
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
    
        let parentContainer = document.getElementById(`replies-${parentId}`) || document.getElementById(`post-${parentId}`);
        parentContainer.appendChild(formContainer);
        
        const form = formContainer.querySelector('form'); // Correctly target the <form> for event handling
        form.onsubmit = async (event) => await submitReply(event, parentId, form); // Pass the form to submitReply
        formContainer.querySelector('.cancelReply').onclick = () => closeReplyForm(form); // Adjust to pass the form to closeReplyForm
    }

    replyForm.style.display = 'block'; // Show the form
    replyForm.querySelector('.replyInput').focus(); // Focus on the input field
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
        // Optionally, refresh replies to show the new reply
        fetchReplies(postId);
    } catch (error) {
        console.error("Error submitting reply to thread: ", error);
    }
}




function closeReplyForm(form) {
    form.style.display = 'none';
    form.reset();
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
        return `${minutesAgo} mins. ago`;
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