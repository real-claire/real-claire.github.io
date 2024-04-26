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

var mockUser = {
    displayName: "Claire",
    photoURL: "assets/img.jpg"
};

const useMockAuth = false;
var mockSignedIn = false;

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('createForumForm').style.display = 'none';
    document.getElementById('createForumForm').addEventListener('submit', postForum);

    if (useMockAuth)
    {
        if (mockSignedIn) {
            document.querySelector(".login-warning").style.display = 'none';
            document.getElementById('createForumForm').style.display = 'block';
            document.querySelectorAll('.replyButton').forEach(el => el.style.display = 'inline-block');
        } else {
            document.querySelector(".login-warning").style.display = 'block';
            document.getElementById('createForumForm').style.display = 'none';
            document.querySelectorAll('.replyButton').forEach(el => el.style.display = 'none');
        }
        fetchForums();
    } else {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                document.querySelector(".login-warning").style.display = 'none';
                document.getElementById('createForumForm').style.display = 'block';
                document.querySelectorAll('.replyButton').forEach(el => el.style.display = 'inline-block');
            } else {
                document.querySelector(".login-warning").style.display = 'block';
                document.getElementById('createForumForm').style.display = 'none';
                document.querySelectorAll('.replyButton').forEach(el => el.style.display = 'none');
                fetchForums();
            }
        });
    }

    const sortOrderSelect = document.getElementById('sortOrderSelect');
    if (sortOrderSelect) {
        sortOrderSelect.addEventListener('change', function() {
            const selectedSortOrder = this.value;
            fetchForums(selectedSortOrder);
        });
    } else {
        console.error('sortOrderSelect element not found.');
    }

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
        } else if (event.target.matches('.deleteButton')) { // When a delete button is clicked
            const postId = event.target.getAttribute('data-postId');
            deleteMessage(postId); // Call the function to delete the message
        } else if (event.target.matches('.editButton')) { // When an edit button is clicked
            const postId = event.target.getAttribute('data-postId');
            displayEditForm(postId); // Call the function to show the edit form
        }
    });

    document.getElementById("authButton").addEventListener("click", signIn);

    document.querySelector('.user-details').addEventListener('click', toggleDropdown);

    window.onclick = function(event) {
        const userDropdown = document.getElementById('userDropdown'); // Ensure this is defined
        if (!event.target.matches('#userInfo, #userInfo *, .user-details')) {
            userDropdown.style.display = 'none';
        }
    };

    document.getElementById('userDropdown').addEventListener('click', function(event) {
        // Check if the clicked element is a button with a data-action attribute
        if (event.target.tagName === 'BUTTON' && event.target.dataset.action) {
            const action = event.target.dataset.action;
            
            switch (action) {
                case 'logout':
                    signOutUser();
                    break;
                // Add cases for other actions as you add more buttons
                default:
                    console.log('Action not recognized:', action);
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

            const isUserAuthor = auth.currentUser && message.userName === auth.currentUser.displayName; // Check if current user is the author
            const deleteButtonHTML = isUserAuthor ? `<button class="deleteButton" data-postId="${doc.id}">Delete</button>` : ''; // Conditional delete button
            const editButtonHTML = isUserAuthor ? `<button class="editButton" data-postId="${doc.id}">Edit</button>` : ''; // Conditional edit button

            const postId = `post-${doc.id}`;
            const messageElement = document.createElement('div');

            const replyBoxHTML = auth.currentUser || mockSignedIn ? `
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
                        ${deleteButtonHTML}
                        ${editButtonHTML}
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

            const isUserAuthor = auth.currentUser && message.userName === auth.currentUser.displayName; // Check if current user is the author
            const deleteButtonHTML = isUserAuthor ? `<button class="deleteButton" data-postId="${doc.id}">Delete</button>` : ''; // Conditional delete button

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
                ${auth.currentUser || mockSignedIn  ? `<button class='replyButton' data-postId='${doc.id}'>Reply</button>` : ''}
                ${deleteButtonHTML}
                <div id="replies-${doc.id}"></div>
            `;
                          
            repliesContainer.appendChild(replyElement);

            fetchReplies(doc.id, level + 1);
        });
    } catch (error) {
        console.error("Error fetching replies: ", error);
    }
}

let currentOpenFormId = null;

function displayReplyForm(postId, level = 0) {
    if (currentOpenFormId && currentOpenFormId !== postId) {
        const currentlyOpenForm = document.getElementById(`replyForm-${currentOpenFormId}`);
        if (currentlyOpenForm) {
            currentlyOpenForm.style.display = 'none';
            const formToReset = currentlyOpenForm.querySelector('form');
            if (formToReset) {
                formToReset.reset();
            }
            const currentOpenReplyButton = document.querySelector(`[data-postId="${currentOpenFormId}"].replyButton`);
            if (currentOpenReplyButton) {
                currentOpenReplyButton.style.display = '';
            }
        }
    }

    const replyButton = document.querySelector(`[data-postId="${postId}"].replyButton`);
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

        const form = formContainer.querySelector('form');
        form.onsubmit = async (event) => {
            event.preventDefault();
            await submitReply(event, postId, form);
            // Reveal the reply button when the reply is submitted
            replyButton.style.display = '';
        };

        formContainer.querySelector('.cancelReply').onclick = () => {
            closeReplyForm(formContainer);
            // Reveal the reply button when the form is canceled
            replyButton.style.display = '';
        };

        formContainer.style.display = 'block';
        formContainer.querySelector('.replyInput').focus();
    } else {
        replyForm.style.display = 'block';
        replyForm.querySelector('.replyInput').focus();
    }

    currentOpenFormId = postId;

    // Hide the reply button that was clicked
    replyButton.style.display = 'none';
}


function closeReplyForm(form) {
    form.style.display = 'none';
    form.querySelector('form').reset();

    // Find the postId of the form being closed
    const postIdMatch = form.id.match(/replyForm-(.*)/);
    if (postIdMatch) {
        const postId = postIdMatch[1];
        // Reset currentOpenFormId if this is the form that was open
        if (postId === currentOpenFormId) {
            currentOpenFormId = null;
        }

        // Make the reply button visible again
        const replyButton = document.querySelector(`[data-postId="${postId}"].replyButton`);
        if (replyButton) {
            replyButton.style.display = '';
        }
    }
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

async function editMessage(postId, newContent) {
    try {
        const docRef = doc(db, "messages", postId);
        await updateDoc(docRef, {
            content: `${newContent} (edited)`, // Append (edited) to the new content
        });

        fetchForums(); // Refresh the forums to reflect the edit
    } catch (error) {
        console.error("Error editing message: ", error);
        alert("Failed to edit the message.");
    }
}


function signIn() {
    if (useMockAuth === true) {
        document.getElementById('createForumForm').style.display = 'block';
        document.querySelectorAll('.replyButton').forEach(el => el.style.display = 'inline-block');
        document.getElementById("userInfo").style.display = "flex";
        document.getElementById("authButton").style.display = "none";
        document.getElementById("userPic").src = "img.jpg" || 'default_avatar.png';
        document.getElementById("userName").textContent = "Claire";
        document.querySelector(".login-warning").style.display = 'none';
        mockSignedIn = true;
        fetchForums();
        return;
    }
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("User signed in");
            document.getElementById("userInfo").style.display = "flex";
            document.getElementById("authButton").style.display = "none";
            document.getElementById('createForumForm').style.display = 'block';
            document.getElementById("userPic").src = result.user.photoURL || 'default_avatar.png';
            document.getElementById("userName").textContent = `${result.user.displayName}`;
            document.querySelector(".login-warning").style.display = 'none';
        })
        .catch((error) => {
            console.error("Error signing in: ", error);
            alert("Failed to sign in.");
        });
}

async function deleteMessage(postId) {
    try {
        const docRef = doc(db, "messages", postId);
        await updateDoc(docRef, {
            userName: "[deleted]",
            content: "[deleted]",
        });

        // Re-fetch forums to reflect the changes
        fetchForums();
    } catch (error) {
        console.error("Error deleting message: ", error);
        alert("Failed to delete the message.");
    }
}

function displayEditForm(postId) {
    const existingEditForm = document.querySelector(`#editForm-${postId}`);
    if (existingEditForm) {
        existingEditForm.style.display = 'block';
        return;
    }

    const editForm = document.createElement('div');
    editForm.id = `editForm-${postId}`;
    editForm.innerHTML = `
        <form>
            <textarea class="editInput" required></textarea>
            <div class="form-actions">
                <button type="submit" class="submitEdit">Submit Edit</button>
                <button type="button" class="cancelEdit">Cancel</button>
            </div>
        </form>
    `;

    const parentContainer = document.getElementById(`post-${postId}`) || document.getElementById(`replies-${postId}`);
    parentContainer.appendChild(editForm);

    const form = editForm.querySelector('form');
    form.onsubmit = async (event) => {
        event.preventDefault();
        const newContent = form.querySelector('.editInput').value;
        await editMessage(postId, newContent);

        // Hide the edit form after submitting
        editForm.style.display = 'none';
    };

    editForm.querySelector('.cancelEdit').onclick = () => {
        editForm.style.display = 'none';
    };

    // Pre-populate the text area with the existing content
    const currentContent = parentContainer.querySelector('p').textContent;
    editForm.querySelector('.editInput').value = currentContent.replace(" (edited)", ""); // Remove the "(edited)" suffix for the pre-populated content
}


function signOutUser() {
    document.getElementById("userDropdown").style.display = 'none';

    if (useMockAuth === true) {
        document.getElementById("userInfo").style.display = "none";
        document.getElementById("authButton").style.display = "block";
        document.getElementById('createForumForm').style.display = 'none';
        document.querySelector(".login-warning").style.display = 'block';
        document.querySelectorAll('.replyButton').forEach(el => el.style.display = 'none');
        mockSignedIn = false;
        fetchForums();
        return;
    }

    signOut(auth).then(() => {
        console.log("User signed out successfully");
        document.getElementById("userInfo").style.display = "none";
        document.getElementById("authButton").style.display = "block";
        document.getElementById('createForumForm').style.display = 'block';
        document.querySelector(".login-warning").style.display = 'block';
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

function toggleDropdown(event) {
    const userDropdown = document.getElementById('userDropdown');
    const isVisible = userDropdown.style.display === 'block';
    userDropdown.style.display = isVisible ? 'none' : 'block';

    event.stopPropagation();
}

onAuthStateChanged(auth, (user) => {
    const userInfo = document.getElementById('userInfo');
    const authButton = document.getElementById('authButton');

    if (user) {
        document.getElementById('userPic').src = user.photoURL || 'default_avatar.png';
        document.getElementById('userName').textContent = `${user.displayName.split(' ')[0]}`;
        document.querySelector(".login-warning").style.display = 'none';
        userInfo.style.display = 'flex';
        authButton.style.display = 'none';
    } else {
        document.querySelector(".login-warning").style.display = 'block';
        userInfo.style.display = 'none';
        authButton.style.display = 'block';
    }
});