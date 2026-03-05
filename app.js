const clientId = 'f3309d6b27164ad2b14289af6eac4b59';
const clientSecret = '05d5d8660fad4c4f8dd617b87db2a4c6';

// 1. Función para obtener el Token de Acceso
async function getToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    return data.access_token;
}

// 2. Función para buscar álbumes o canciones
async function searchSpotify(query) {
    const token = await getToken();
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=album,track&limit=10`, {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await response.json();
    displayResults(data.albums.items); // Mandamos los álbumes a una función que los pinte
}

// 3. Función para mostrar los resultados en el HTML
function displayResults(albums) {
    const container = document.getElementById('results-container');
    container.innerHTML = ''; // Limpiar búsqueda anterior

    albums.forEach(album => {
        const card = document.createElement('div');
        card.classList.add('album-card');
        card.innerHTML = `
            <img src="${album.images[0].url}" alt="${album.name}">
            <h3>${album.name}</h3>
            <p>${album.artists[0].name}</p>
        `;
        // Al hacer click, buscaremos los detalles del álbum
        card.onclick = () => getAlbumDetails(album.id);
        container.appendChild(card);
    });
}

// Escuchar el evento del botón de búsqueda
document.getElementById('search-btn').addEventListener('click', () => {
    const query = document.getElementById('search-input').value;
    if (query) searchSpotify(query);
});

async function getAlbumDetails(albumId) {
    const token = await getToken();
    const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const album = await response.json();

    // BUSCAMOS SI YA EXISTE EN EL HISTORIAL
    const history = JSON.parse(localStorage.getItem('listeningHistory')) || [];
    const savedEntry = history.find(entry => entry.albumId === albumId);

    const modal = document.getElementById('details-modal');
    const modalBody = document.getElementById('modal-body');

    // Si existe, preparamos el resumen de lo guardado
    let savedInfoHTML = '';
    if (savedEntry) {
        savedInfoHTML = `
            <div class="saved-badge">✅ Álbum Registrado</div>
            <div class="saved-data">
                <p><strong>Fecha:</strong> ${savedEntry.date}</p>
                <p><strong>Tu Nota:</strong> ${savedEntry.rating}/10 ⭐</p>
                <p><strong>Favoritos:</strong> ${savedEntry.favTracks.join(', ') || 'Ninguno'}</p>
            </div>
            <hr>
        `;
    }

    modalBody.innerHTML = `
        <div class="modal-header-flex">
            <img src="${album.images[0].url}" class="modal-cover">
            <div class="modal-info-text">
                ${savedInfoHTML}
                <h2>${album.name}</h2>
                <p class="artist-name">${album.artists[0].name}</p>
                <p class="album-meta">${album.release_date.split('-')[0]} • ${album.total_tracks} canciones</p>
            </div>
        </div>
        
        <h3>Lista de canciones</h3>
        <ul class="tracklist">
            ${album.tracks.items.map(track => {
                // Si el tema estaba en favoritos, le ponemos un check o color distinto
                const isFav = savedEntry && savedEntry.favTracks.includes(track.name);
                return `
                    <li class="track-item ${isFav ? 'is-favorite' : ''}">
                        <span>${track.track_number}. ${track.name}</span>
                        ${isFav ? '<span>❤️</span>' : ''}
                    </li>
                `;
            }).join('')}
        </ul>
        
        ${!savedEntry ? `<button class="btn-primary" onclick="registerAlbum('${album.id}')">Registrar Escucha</button>` : ''}
    `;

    modal.classList.remove('hidden');
    document.querySelector('.bottom-nav').style.display = 'none';
}

// Esta función ahora muestra el formulario de registro
function registerAlbum(albumId) {
    const modalBody = document.getElementById('modal-body');
    
    // Guardamos el contenido actual (la info del álbum) para no perderla o simplemente redibujamos
    // Aquí vamos a crear el formulario:
    modalBody.innerHTML = `
        <div class="registration-form">
            <h2>Registrar Escucha</h2>
            
            <label>¿Cuándo lo escuchaste?</label>
            <input type="date" id="listen-date" value="${new Date().toISOString().split('T')[0]}">
            
            <label>Calificación (1 a 10 ⭐)</label>
            <input type="number" id="album-rating" min="1" max="10" value="7">
            
            <label>Canciones favoritas:</label>
            <div id="fav-tracks-selection">
                <p style="font-size: 12px; color: #b3b3b3;">Cargando tracks...</p>
            </div>
            
            <div class="modal-actions-sticky">
    <button class="btn-register" onclick="saveLoggedAlbum('${albumId}')">Confirmar Registro</button>
    <button class="btn-cancel" onclick="getAlbumDetails('${albumId}')">Volver</button>
</div>
        </div>
    `;
    
    // Volvemos a pedir los tracks para que el usuario elija
    loadTracksForRegistry(albumId);
}

// Función auxiliar para cargar los checks de canciones
async function loadTracksForRegistry(albumId) {
    const token = await getToken();
    const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const album = await response.json();
    const container = document.getElementById('fav-tracks-selection');
    
    container.innerHTML = album.tracks.items.map(t => `
        <div class="track-item">
            <span>${t.track_number}. ${t.name}</span>
            <input type="checkbox" class="track-fav" value="${t.name}">
        </div>
    `).join('');
}

function showPage(pageId, element) {
    // 1. Ocultar todas las secciones correctamente
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });

    // 2. Mostrar la sección elegida
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    // 3. ACTUALIZAR LA BARRA (Quitar/Poner clase active)
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });
    if (element) {
        element.classList.add('active');
    }

    // 4. LIMPIAR BÚSQUEDA si vamos al Inicio
    if (pageId === 'page-home') {
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<p class="empty-msg">Busca algo para empezar...</p>';
        }
        document.getElementById('search-input').value = '';
    }

    // 5. Cargar historial si vamos a registros
    if (pageId === 'page-records') {
        renderHistory();
    }
}

async function loadRecommendations() {
    const token = await getToken();
    try {
        // Pedimos los nuevos lanzamientos a Spotify
        const response = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=6', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        
        const container = document.getElementById('recommendations-container');
        container.innerHTML = ''; // Limpiamos

        data.albums.items.forEach(album => {
            const card = document.createElement('div');
            card.classList.add('album-card');
            card.innerHTML = `
                <img src="${album.images[0].url}" alt="${album.name}">
                <h3>${album.name}</h3>
                <p>${album.artists[0].name}</p>
            `;
            card.onclick = () => getAlbumDetails(album.id);
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error cargando recomendados:", error);
    }
}

async function saveLoggedAlbum(albumId) {
    const date = document.getElementById('listen-date').value;
    const rating = document.getElementById('album-rating').value;
    const selectedTracks = Array.from(document.querySelectorAll('.track-fav:checked')).map(cb => cb.value);

    // Corregimos la URL para que use el API oficial de Spotify correctamente
    const token = await getToken();
    const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    
    // Si la respuesta falla, avisamos y no guardamos undefined
    if (!response.ok) {
        alert("Error al obtener los datos del álbum. Asegúrate de usar Live Server.");
        return;
    }
    
    const album = await response.json();

    const logEntry = {
        albumId: album.id,
        albumName: album.name,
        artistName: album.artists[0].name,
        albumImg: album.images[0].url,
        date: date,
        rating: rating,
        favTracks: selectedTracks,
        timestamp: Date.now()
    };

    let history = JSON.parse(localStorage.getItem('listeningHistory')) || [];
    history.unshift(logEntry); 
    localStorage.setItem('listeningHistory', JSON.stringify(history));

    alert("¡Registro guardado con éxito! ⭐");
    document.getElementById('details-modal').classList.add('hidden');
    
    // Recuperar la barra inferior
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    renderHistory();
}

function renderHistory() {
    const container = document.getElementById('history-container');
    const history = JSON.parse(localStorage.getItem('listeningHistory')) || [];

    if (history.length === 0) {
        container.innerHTML = `<p class="empty-msg">Aún no tienes registros.</p>`;
        return;
    }

    container.innerHTML = history.map(entry => `
        <div class="history-card" onclick="getAlbumDetails('${entry.albumId}')">
            <img src="${entry.albumImg}" class="history-img">
            <div class="history-info">
                <h4>${entry.albumName}</h4>
                <p>${entry.artistName}</p>
                <div class="history-date">Escuchado el: ${entry.date}</div>
            </div>
            <div style="text-align:right">
                <div class="history-rating">${entry.rating} / 10 ⭐</div>
                <small style="color:#1DB954; font-size:10px;">${entry.favTracks ? entry.favTracks.length : 0} favs</small>
            </div>
        </div>
    `).join('');
}

function likeAlbum(id) {
    console.log("Añadiendo a favoritos:", id);
    alert("Añadido a favoritos ❤️");
}

document.querySelector('.close-btn').addEventListener('click', () => {
    document.getElementById('details-modal').classList.add('hidden');
    // 👇 Agrega esta línea para recuperar la barra
    document.querySelector('.bottom-nav').style.display = 'flex';
});

window.onload = () => {
    // Cargamos los recomendados apenas abre la app
    loadRecommendations();
    
    // Si ya tenías registros, los dejamos listos en segundo plano
    renderHistory();
};