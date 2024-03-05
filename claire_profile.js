function onlyPlayOneIn(container) {
  container.addEventListener("play", function(event) {
  audio_elements = container.getElementsByTagName("audio")
    for(i=0; i < audio_elements.length; i++) {
      audio_element = audio_elements[i];
      audio_elements[i].volume = 0.05;
      if (audio_element !== event.target) {
        audio_element.pause();
      }
    }
  }, true);
}
  
document.addEventListener("DOMContentLoaded", function() {
  onlyPlayOneIn(document.body);
});

var firebaseConfig = {
  apiKey: "AIzaSyCNg0dn4mTW4E489OkRxwvXAzr25qOMS1M",
  authDomain: "real-claire.github.io",
  projectId: "portfolio-forum-cce27",
  storageBucket: "gs://portfolio-forum-cce27",
  messagingSenderId: "200834829160",
  appId: "1:200834829160:web:a97c64807874a4aa4c24dd"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

// Add a new forum
function addForum(title, description) {
  db.collection("forums").add({
    title: title,
    description: description,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then((docRef) => {
    console.log("Forum created with ID: ", docRef.id);
  }).catch((error) => {
    console.error("Error adding document: ", error);
  });
}

// Fetch all forums
function fetchForums() {
  db.collection("forums").orderBy("createdAt").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} => ${doc.data().title}`);
      // Process each forum
    });
  });
}
