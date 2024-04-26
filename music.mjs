const firebaseConfig = {
    apiKey: "AIzaSyCNg0dn4mTW4E489OkRxwvXAzr25qOMS1M",
    authDomain: "portfolio-forum-cce27.firebaseapp.com",
    projectId: "portfolio-forum-cce27",
    storageBucket: "portfolio-forum-cce27.appspot.com",
    messagingSenderId: "200834829160",
    appId: "1:200834829160:web:a97c64807874a4aa4c24dd",
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
    fetchDataAndSort('desc');  // Default sorting order

    const sortOrderSelect = document.getElementById('sortOrderSelect');
    sortOrderSelect.addEventListener('change', () => {
        fetchDataAndSort(sortOrderSelect.value);
    });
});

function fetchDataAndSort(order) {
    const musicCardsContainer = document.querySelector('.grid-container');
    musicCardsContainer.innerHTML = '';  // Clear existing content

    db.collection("Songs").get().then((querySnapshot) => {
        const songs = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            songs.push(data);
        });

        if (order === 'asc') {
            songs.sort((a, b) => parseDate(a.composed) - parseDate(b.composed));
        } else {
            songs.sort((a, b) => parseDate(b.composed) - parseDate(a.composed));
        }

        // Create HTML for each sorted song
        songs.forEach((data) => {
            const cardHtml = `
                <div class="music-card">
                    <h2>${data.title}</h2>
                    <audio controls="controls">
                        <source src="${data.url}">
                    </audio>
                    <p>${data.description}</p>
                    <br><p class="subtext" style="font-size: 10pt;">Composed ${data.composed}</p>
                </div>
            `;
            musicCardsContainer.innerHTML += cardHtml;
        });
    }).catch((error) => {
        console.error("Error getting documents: ", error);
    });
}

function parseDate(dateStr) {
    const monthNames = {
        "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
        "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
    };
    const parts = dateStr.split(' ');
    const month = monthNames[parts[0]];
    const day = parseInt(parts[1].replace(/nd|th|rd|st/, ''), 10);
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
}
  
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
  