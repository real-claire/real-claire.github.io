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