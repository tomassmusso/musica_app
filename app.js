// CONFIGURACIÓN REAL DE SPOTIFY
const clientId = 'f3309d6b27164ad2b14289af6eac4b59';
const clientSecret = '05d5d8660fad4c4f8dd617b87db2a4c6';

let accessToken = '';

// ¡DIRECCIONES REALES SEPARADAS PARA QUE EL CHAT NO LAS BORRE!
// Reemplaza las variables de las URLs por estas:
const urlToken = 'https://accounts.spotify.com/api/token'
const urlBusqueda = 'https://api.spotify.com/v1/search?q='
const urlDetalles = 'https://api.spotify.com/v1/albums/'

// 1. OBTENER TOKEN
async function getSpotifyToken() {
    try {
        const response = await fetch(urlToken, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });
        const data = await response.json();
        accessToken = data.access_token;
        console.log("✅ Conectado a Spotify de verdad");
    } catch (error) {
        console.error("❌ Error de token:", error);
    }
}

// 2. BUSCAR ÁLBUMES
async function searchAlbums() {
    const query = document.getElementById('search-input').value;
    if (!query) return;

    if (!accessToken) await getSpotifyToken();

    try {
        // Armamos la dirección completa aquí
        const endpoint = urlBusqueda + encodeURIComponent(query) + '&type=album&limit=12';
        
        const response = await fetch(endpoint, {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        const data = await response.json();
        
        if (data.albums && data.albums.items.length > 0) {
            renderResults(data.albums.items);
        } else {
            console.log("No se encontraron resultados");
        }
    } catch (error) {
        console.error("❌ Error en la búsqueda:", error);
    }
}

// 3. PINTAR RESULTADOS
function renderResults(albums) {
    const container = document.getElementById('results-container');
    container.innerHTML = '';

    albums.forEach(album => {
        const div = document.createElement('div');
        div.className = 'card';
        // También separé esta URL de imagen por si acaso
        const imgUrl = album.images[0]?.url || ('https://' + 'placehold.co/300x300/282828/FFF?text=Sin+Portada');
        
        div.innerHTML = `
            <img src="${imgUrl}" alt="Cover">
            <div class="info">
                <h4>${album.name}</h4>
                <p>${album.artists[0].name}</p>
                <div class="card-buttons">
                    <button class="btn-save" onclick="saveAlbum('${album.id}', '${album.name.replace(/'/g, "\\'")}', '${album.artists[0].name.replace(/'/g, "\\'")}', '${imgUrl}')">Añadir</button>
                    <button class="btn-detail" onclick="showDetails('${album.id}')">Canciones</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// 4. DETALLES (Canciones)
async function showDetails(albumId) {
    if (!accessToken) await getSpotifyToken();
    try {
        const endpoint = urlDetalles + albumId;
        const response = await fetch(endpoint, {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        const album = await response.json();

        const modalBody = document.getElementById('modal-body');
        const tracklist = album.tracks.items.map(t => `<li>${t.track_number}. ${t.name}</li>`).join('');
        
        modalBody.innerHTML = `
            <div style="text-align:center">
                <img src="${album.images[0].url}" style="width:150px; border-radius:8px">
                <h3>${album.name}</h3>
                <p>${album.artists[0].name}</p>
            </div>
            <ul class="tracklist" style="list-style:none; padding:0; text-align:left; margin-top:20px;">${tracklist}</ul>
        `;
        document.getElementById('modal').classList.remove('hidden');
    } catch (error) {
        console.error("Error al cargar detalles:", error);
    }
}

// 5. LOCAL STORAGE (Biblioteca)
function saveAlbum(id, name, artist, img) {
    let myLibrary = JSON.parse(localStorage.getItem('myLibrary')) || [];
    if (!myLibrary.find(a => a.id === id)) {
        myLibrary.push({ id, name, artist, img });
        localStorage.setItem('myLibrary', JSON.stringify(myLibrary));
        renderLibrary();
    }
}

function renderLibrary() {
    const container = document.getElementById('library-container');
    const myLibrary = JSON.parse(localStorage.getItem('myLibrary')) || [];
    container.innerHTML = '';

    myLibrary.forEach(album => {
        const div = document.createElement('div');
        div.className = 'card saved';
        div.innerHTML = `
            <img src="${album.img}" alt="Cover">
            <div class="info">
                <h4>${album.name}</h4>
                <p>${album.artist}</p>
                <button class="btn-delete" onclick="deleteAlbum('${album.id}')">Eliminar</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function deleteAlbum(id) {
    let myLibrary = JSON.parse(localStorage.getItem('myLibrary'));
    myLibrary = myLibrary.filter(a => a.id !== id);
    localStorage.setItem('myLibrary', JSON.stringify(myLibrary));
    renderLibrary();
}

// EVENTOS
document.getElementById('search-btn').addEventListener('click', searchAlbums);
document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchAlbums();
});
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('modal').classList.add('hidden');
});

window.onload = () => {
    renderLibrary();
    if (location.protocol !== 'file:' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.log("SW error", err));
    }
};