document.getElementById('auth').addEventListener('click', function() {
    // Start the authentication process
    window.location.href = `https://real-claire-github-io.vercel.app/api/auth`;
});

document.getElementById('loadSongs').addEventListener('click', async function() {
    try {
        // Fetch the songs from the serverless API endpoint
        const response = await fetch('https://real-claire-github-io.vercel.app/api/files');
        if (!response.ok) throw new Error('Failed to fetch songs');
        
        const songs = await response.json();
        const list = document.getElementById('songList');
        list.innerHTML = ''; // Clear the list first

        // Add each song to the list
        songs.forEach(song => {
            const item = document.createElement('li');
            item.textContent = song.name; // Assume 'name' is part of the object returned
            list.appendChild(item);
        });

        // Show the list and hide authentication button
        document.getElementById('loadSongs').style.display = 'none';
    } catch (error) {
        console.error('Error loading songs:', error);
    }
});

// Check if redirected from OAuth
if (window.location.search.includes('code=')) {
    // Assume 'code' is present in the URL query parameters
    document.getElementById('auth').style.display = 'none';
    document.getElementById('loadSongs').style.display = 'block';
}
