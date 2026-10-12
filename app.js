const API_KEY = '0d5d1ec7f876cbbc94d8fea9e9f32dc9'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const seriesGrid    = document.getElementById('series-grid');
const loadingDiv    = document.getElementById('loading');
const errorDiv      = document.getElementById('error');
const errorMessage  = document.getElementById('error-message');
const resultsTitle  = document.getElementById('results-title');
const resultsCount  = document.getElementById('results-count');
const searchInput   = document.getElementById('search');
const clearBtn      = document.getElementById('clear-search');
const retryBtn      = document.getElementById('retry-btn');
const themeToggle   = document.getElementById('theme-toggle');
const modal         = document.getElementById('serie-modal');
const modalBody     = document.getElementById('modal-body');
const modalClose    = document.getElementById('modal-close');
const modalOverlay  = document.getElementById('modal-overlay');
// ============================================================================
// UTILIDADES DE UI (DADO - no modificar)
// ============================================================================
const mostrarLoading = () => {
    loadingDiv.style.display = 'flex';
    errorDiv.style.display = 'none';
    seriesGrid.innerHTML = '';
};

const ocultarLoading = () => {
    loadingDiv.style.display = 'none';
};

const mostrarError = (mensaje) => {
    ocultarLoading();
    errorMessage.textContent = mensaje;
    errorDiv.style.display = 'flex';
    seriesGrid.innerHTML = '';
};


// ============================================================================
// DARK MODE (DADO - no modificar)
// ============================================================================
const aplicarTema = (tema) => {
    document.documentElement.setAttribute('data-theme', tema);
    themeToggle.textContent = tema === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', tema);
};

const cargarTema = () => {
    const guardado = localStorage.getItem('theme');
    const preferido = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    aplicarTema(guardado || preferido);
};

themeToggle.addEventListener('click', () => {
    const actual = document.documentElement.getAttribute('data-theme');
    aplicarTema(actual === 'dark' ? 'light' : 'dark');
});

cargarTema();

////////////////////////////////////////////////////
//Carga inicial

async function cargarSeries() {
    mostrarLoading();
    try {
        const url = `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES`;
        const respuesta = await fetch(url);
        if (respuesta.status === 401) {
            throw new Error('API Key inválida');
        }
        if (!respuesta.ok) {
            throw new Error('Error de conexión');
        }
        const datos = await respuesta.json();
        mostrarSeries(datos.results);
        resultsTitle.textContent = 'Series Populares';
        resultsCount.textContent = `${datos.results.length} series encontradas`;
        ocultarLoading();
    } catch (error) {
        mostrarError(
            error.message === 'API Key inválida'? 'API Key inválida':'Error de conexión'
        );
    }
}

//Tarjeta de serie
function mostrarSeries(listaSeries) {
    seriesGrid.innerHTML = '';
    if (listaSeries.length === 0) {
        seriesGrid.innerHTML ='<p>No se encontraron series.</p>';////////////////////////
        return;
    }

    listaSeries.forEach(function (serie) {
        const tarjeta = document.createElement('article');
        tarjeta.className = 'serie-card';
        const titulo = serie.name || 'Sin título';
        const anio = serie.first_air_date ? serie.first_air_date.substring(0, 4) : 'Sin fecha';
        const puntuacion = Number(serie.vote_average || 0).toFixed(1);
        const imagen = serie.poster_path? IMAGE_URL + serie.poster_path : 'https://placehold.co/500x750?text=Sin+imagen';
        tarjeta.innerHTML = `
            <div class="serie-card__poster">
                <img
                    class="serie-card__image"
                    src="${imagen}"
                    alt="${titulo}"
                    loading="lazy"
                >
                <span class="serie-card__rating"> ${puntuacion}</span>
            </div>

            <div class="serie-card__content">
                <h3 class="serie-card__title">${titulo}</h3>
                <p class="serie-card__year">${anio}</p>
            </div>
        `;

        tarjeta.addEventListener('click', function () {
            consultarDetalle(serie.id);
        });
        seriesGrid.appendChild(tarjeta);
    });
}


//Busqueda

let temporizadorBusqueda;
searchInput.addEventListener('input', function () {
    const texto = searchInput.value.trim();
    clearTimeout(temporizadorBusqueda);
    if (texto === '') {
        cargarSeries();
        return;
    }
    temporizadorBusqueda = setTimeout(function () {
        buscarSeries(texto);
    }, 400);
});
async function buscarSeries(texto) {
    mostrarLoading();
    try {
        const consulta = encodeURIComponent(texto);
        const url = `${BASE_URL}/search/tv?api_key=${API_KEY}&language=es-ES&query=${consulta}`;
        const respuesta = await fetch(url);
        if (respuesta.status === 401) {
            throw new Error('API Key inválida');
        }
        if (!respuesta.ok) {
            throw new Error('Error de conexión');
        }
        const datos = await respuesta.json();
        mostrarSeries(datos.results);
        resultsTitle.textContent = `Resultados para: "${texto}"`;
        resultsCount.textContent = `${datos.results.length} series encontradas`;
        ocultarLoading();
    } catch (error) {
        mostrarError(
            error.message === 'API Key inválida'? 'API Key inválida': 'Error de conexión'
        );
    }
}
// Botón para limpiar
clearBtn.addEventListener('click', function () {
    searchInput.value = '';
    cargarSeries();
}); 
retryBtn.addEventListener('click', function () {
    const texto = searchInput.value.trim();
    if (texto !== '') {
        buscarSeries(texto);
    } else {
        cargarSeries();
    }
});
//Modal de detalle
async function consultarDetalle(idSerie) {
    try {
        const url = `${BASE_URL}/tv/${idSerie}?api_key=${API_KEY}&language=es-ES`;
        const respuesta = await fetch(url);
        if (respuesta.status === 401) {
            throw new Error('API Key inválida');
        }
        if (!respuesta.ok) {
            throw new Error('Error de conexión');
        }
        const serie = await respuesta.json();
        const generos = serie.genres && serie.genres.length > 0 ? serie.genres.map(function (genero) { return genero.name;}).join(', ')
            : 'No especificados';
        const imagen = serie.poster_path ? IMAGE_URL + serie.poster_path: '';
        modalBody.innerHTML = `<h2 class="modal__title">${serie.name || 'Sin título'}</h2> ${serie.tagline ? `<p class="modal__subtitle">${serie.tagline}</p>`: ''}
            ${imagen ? `<img src="${imagen}"
                    alt="${serie.name || 'Serie'}"
                    style="width:100%; max-height:300px; object-fit:cover; border-radius:8px;">`: ''}

            <div class="modal__info">
                <span><strong>Estado:</strong> ${serie.status || 'No disponible'}</span>
                <span><strong>Temporadas:</strong> ${serie.number_of_seasons ?? 0}</span>
                <span><strong>Episodios:</strong> ${serie.number_of_episodes ?? 0}</span>
                <span><strong>Géneros:</strong> ${generos}</span>
            </div>

            <p class="modal__overview">
                <strong>Sinopsis:</strong>
                ${serie.overview || 'Sin descripción disponible.'}
            </p>
        `;

        modal.classList.add('modal--show');

    } catch (error) {
        alert(
            error.message === 'API Key inválida'
                ? 'API Key inválida'
                : 'Error de conexión'
        );
    }
}


//Cerramos la ventana de detalles 
function cerrarDetalle() {
    modal.classList.remove('modal--show');
}
modalClose.addEventListener('click', cerrarDetalle);
modalOverlay.addEventListener('click', cerrarDetalle);

document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape') {
        cerrarDetalle();
    }
});
cargarSeries();


