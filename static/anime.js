const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('id');
let currentMalId = null;
let currentEpisode = 1;
let availableServers = [];
let player = null;

const videoFrame = document.getElementById('video-frame');
const plyrVideoMain = document.getElementById('plyr-video-main');
const videoOverlay = document.getElementById('video-overlay');
const videoTitle = document.getElementById('video-title');
const serverTabsContainer = document.getElementById('server-tabs');
const episodesGrid = document.getElementById('episodes-grid');

async function loadServers() {
    try {
        const resp = await fetch('/api/servers');
        const data = await resp.json();
        availableServers = data.servers || [];
        renderServerTabs('2embed');
    } catch(e) {}
}

function renderServerTabs(activeId = '2embed') {
    if (!serverTabsContainer) return;
    serverTabsContainer.innerHTML = '';
    availableServers.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'server-tab' + (s.id === activeId ? ' active' : '');
        btn.dataset.server = s.id;
        btn.innerHTML = `<i class="fas ${s.icon}"></i> ${s.name}`;
        btn.addEventListener('click', function() {
            document.querySelectorAll('.server-tab').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('custom-url-input').style.display = this.dataset.server === 'custom' ? 'flex' : 'none';
            if (this.dataset.server !== 'custom') changeServer(this.dataset.server);
        });
        serverTabsContainer.appendChild(btn);
    });
}

function changeServer(serverId) {
    videoFrame.src = `/api/stream?mal_id=${currentMalId}&episode=${currentEpisode}&server=${serverId}`;
    videoFrame.style.display = 'block';
    if (plyrVideoMain) plyrVideoMain.style.display = 'none';
}

async function loadAnimeDetails() {
    if (!animeId) return window.location.href = '/';
    const resp = await fetch(`/api/anime/${animeId}`);
    const anime = await resp.json();
    currentMalId = anime.mal_id;
    document.title = `${anime.title} - AnimeAI`;
    document.getElementById('anime-poster').src = anime.image;
    document.getElementById('anime-hero-bg').style.backgroundImage = `url(${anime.image})`;
    document.getElementById('anime-title-detailed').textContent = anime.title;
    document.getElementById('anime-title-english').textContent = anime.title_english || '';
    document.getElementById('anime-score').textContent = anime.score || '?';
    document.getElementById('anime-type').textContent = anime.type || '';
    document.getElementById('anime-episodes').textContent = anime.episodes || '?';
    document.getElementById('anime-duration').textContent = anime.duration || '';
    document.getElementById('anime-aired').textContent = anime.aired || '';
    document.getElementById('anime-synopsis').textContent = anime.synopsis || '';
    document.getElementById('anime-genres').innerHTML = (anime.genres || []).map(g => `<span class="genre-tag">${g}</span>`).join('');
    document.getElementById('watch-first-episode').onclick = () => openPlayer(anime.mal_id, anime.title, 1);
    loadEpisodes(anime.episodes || 0);
}

function loadEpisodes(total) {
    episodesGrid.innerHTML = '';
    if (!total) return episodesGrid.innerHTML = '<p>عدد الحلقات غير معروف</p>';
    for (let i = 1; i <= Math.min(total, 100); i++) {
        const btn = document.createElement('button');
        btn.className = 'episode-btn';
        btn.textContent = `حلقة ${i}`;
        btn.onclick = () => openPlayer(currentMalId, document.getElementById('anime-title-detailed').textContent, i);
        episodesGrid.appendChild(btn);
    }
}

function openPlayer(malId, title, ep) {
    currentMalId = malId;
    currentEpisode = ep;
    videoTitle.textContent = `${title} - الحلقة ${ep}`;
    videoOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    changeServer(document.querySelector('.server-tab.active')?.dataset.server || '2embed');
}

function closePlayer() {
    videoOverlay.classList.remove('active');
    document.body.style.overflow = '';
    videoFrame.src = '';
}

document.getElementById('close-video').addEventListener('click', closePlayer);
videoOverlay.addEventListener('click', e => { if (e.target === videoOverlay) closePlayer(); });

document.getElementById('load-custom-url').addEventListener('click', () => {
    const url = document.getElementById('custom-video-url').value.trim();
    if (url) {
        if (/\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(url)) {
            videoFrame.style.display = 'none';
            if (plyrVideoMain) {
                plyrVideoMain.style.display = 'block';
                plyrVideoMain.innerHTML = `<source src="${url}">`;
                if (player) player.destroy();
                player = new Plyr(plyrVideoMain, { controls: ['play','progress','volume','fullscreen'], autoplay: true });
            }
        } else {
            videoFrame.src = url;
            videoFrame.style.display = 'block';
        }
    }
});

document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
});
if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');

document.addEventListener('DOMContentLoaded', async () => {
    await loadServers();
    loadAnimeDetails();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePlayer(); });
