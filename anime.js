const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('id');
let currentAnimeTitle = '';
let currentMalId = null;
let player = null;

const animePoster = document.getElementById('anime-poster');
const animeTitleDetailed = document.getElementById('anime-title-detailed');
const animeTitleEnglish = document.getElementById('anime-title-english');
const animeScore = document.getElementById('anime-score');
const animeType = document.getElementById('anime-type');
const animeEpisodes = document.getElementById('anime-episodes');
const animeDuration = document.getElementById('anime-duration');
const animeAired = document.getElementById('anime-aired');
const animeMembers = document.getElementById('anime-members');
const animeGenres = document.getElementById('anime-genres');
const animeSynopsis = document.getElementById('anime-synopsis');
const animeHeroBg = document.getElementById('anime-hero-bg');
const episodesGrid = document.getElementById('episodes-grid');
const pageTitle = document.getElementById('page-title');
const videoOverlay = document.getElementById('video-overlay');
const videoFrame = document.getElementById('video-frame');
const plyrVideoMain = document.getElementById('plyr-video-main');
const videoTitle = document.getElementById('video-title');
const closeVideo = document.getElementById('close-video');
const pipBtn = document.getElementById('pip-btn');
const themeToggle = document.getElementById('theme-toggle');
const episodeSearch = document.getElementById('episode-search');
const episodeSort = document.getElementById('episode-sort');
const watchFirstBtn = document.getElementById('watch-first-episode');
const addFavBtn = document.getElementById('add-to-favorites');

function createParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 3 + 1;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = Math.random() * 12 + 8 + 's';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.background = i % 2 === 0 ? '#8a2be2' : '#ff69b4';
        container.appendChild(particle);
    }
}

function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const particles = [];
    for (let i = 0; i < 50; i++) {
        particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: Math.random() * 2 + 0.5, speed: Math.random() * 0.3 + 0.1, opacity: Math.random() * 0.4 + 0.2 });
    }
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.y -= p.speed; if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; } ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fillStyle = `rgba(138,43,226,${p.opacity})`; ctx.fill(); });
        requestAnimationFrame(animate);
    }
    animate();
}

function initPosterTilt() {
    const posterContainer = document.getElementById('anime-poster-container');
    if (posterContainer && typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(posterContainer, { max: 20, speed: 400, glare: true, 'max-glare': 0.5, scale: 1.05 });
    }
}

async function loadAnimeDetails() {
    if (!animeId) { window.location.href = '/'; return; }
    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/full`);
        const data = await response.json();
        const anime = data.data;
        currentAnimeTitle = anime.title;
        currentMalId = anime.mal_id;
        document.title = `${anime.title} - AnimeAI`;
        pageTitle.textContent = `${anime.title} - AnimeAI`;
        animePoster.src = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '';
        animePoster.onerror = () => animePoster.src = 'https://via.placeholder.com/300x400/1e1e3a/8a2be2?text=No+Image';
        animeHeroBg.style.backgroundImage = `url(${anime.images?.jpg?.large_image_url || ''})`;
        animeTitleDetailed.textContent = anime.title;
        animeTitleEnglish.textContent = anime.title_english || '';
        animeScore.textContent = anime.score || '?';
        animeType.textContent = anime.type || '?';
        animeEpisodes.textContent = anime.episodes || '?';
        animeDuration.textContent = anime.duration || '?';
        animeAired.textContent = anime.aired?.string || '?';
        animeMembers.textContent = (anime.members || 0).toLocaleString();
        animeSynopsis.textContent = anime.synopsis || 'لا يوجد ملخص متاح.';
        animeGenres.innerHTML = '';
        if (anime.genres) anime.genres.forEach(genre => { const tag = document.createElement('span'); tag.className = 'genre-tag'; tag.textContent = genre.name; animeGenres.appendChild(tag); });
        loadEpisodes(anime.episodes || 0);
        watchFirstBtn.onclick = () => openVideoPlayer(currentMalId || animeId, 1);
    } catch (error) { alert('حدث خطأ في تحميل بيانات الأنمي'); }
}

function loadEpisodes(totalEpisodes) {
    episodesGrid.innerHTML = '';
    if (totalEpisodes === 0) { episodesGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;">عدد الحلقات غير معروف</p>'; return; }
    for (let i = 1; i <= Math.min(totalEpisodes, 100); i++) {
        const btn = document.createElement('button');
        btn.className = 'episode-btn';
        btn.textContent = `حلقة ${i}`;
        btn.onclick = () => openVideoPlayer(currentMalId || animeId, i);
        episodesGrid.appendChild(btn);
    }
}

episodeSearch.addEventListener('input', function() {
    const query = this.value.toLowerCase();
    document.querySelectorAll('.episode-btn').forEach(btn => { btn.style.display = btn.textContent.toLowerCase().includes(query) ? '' : 'none'; });
});
episodeSort.addEventListener('change', function() {
    const buttons = Array.from(document.querySelectorAll('.episode-btn'));
    buttons.sort((a,b) => { const numA = parseInt(a.textContent.replace('حلقة ','')); const numB = parseInt(b.textContent.replace('حلقة ','')); return this.value === 'desc' ? numB - numA : numA - numB; });
    episodesGrid.innerHTML = ''; buttons.forEach(btn => episodesGrid.appendChild(btn));
});

function openVideoPlayer(malId, episodeNumber) {
    const title = currentAnimeTitle || 'الأنمي';
    const embedUrl = `https://www.2embed.skin/embed/anime/mal/${malId}/${episodeNumber}`;
    videoTitle.textContent = `${title} - الحلقة ${episodeNumber}`;
    videoFrame.src = embedUrl;
    videoFrame.style.display = 'block';
    if (plyrVideoMain) plyrVideoMain.style.display = 'none';
    videoOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (player) { player.destroy(); player = null; }
}

function playDirectUrl(url) {
    videoFrame.style.display = 'none';
    if (plyrVideoMain) {
        plyrVideoMain.style.display = 'block';
        plyrVideoMain.innerHTML = '';
        const source = document.createElement('source'); source.src = url; plyrVideoMain.appendChild(source);
        if (player) player.destroy();
        player = new Plyr(plyrVideoMain, { controls: ['play-large','play','progress','current-time','mute','volume','captions','settings','pip','airplay','fullscreen'], autoplay: true, tooltips: { controls: true, seek: true }, hideControls: false, fullscreen: { enabled: true, fallback: true, iosNative: true }, ratio: '16:9' });
    }
}

function closeVideoPlayer() {
    videoOverlay.classList.remove('active');
    document.body.style.overflow = '';
    videoFrame.src = '';
    videoFrame.style.display = 'block';
    if (plyrVideoMain) plyrVideoMain.style.display = 'none';
    if (player) { player.destroy(); player = null; }
}

closeVideo.addEventListener('click', closeVideoPlayer);
videoOverlay.addEventListener('click', (e) => { if (e.target === videoOverlay) closeVideoPlayer(); });
pipBtn.addEventListener('click', async () => {
    const video = document.querySelector('video');
    if (video && video !== plyrVideoMain) {
        if (document.pictureInPictureElement) { await document.exitPictureInPicture(); } else { await video.requestPictureInPicture(); }
    }
});

document.querySelectorAll('.server-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.server-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const customInput = document.getElementById('custom-url-input');
        if (this.dataset.server === 'custom') { customInput.style.display = 'flex'; }
        else { customInput.style.display = 'none'; }
    });
});
document.getElementById('load-custom-url').addEventListener('click', () => {
    const url = document.getElementById('custom-video-url').value.trim();
    if (url) {
        if (/\.(mp4|webm|ogg|m3u8|mpd)(\?.*)?$/i.test(url) || url.includes('youtube.com') || url.includes('vimeo.com')) { playDirectUrl(url); }
        else { videoFrame.src = url; videoFrame.style.display = 'block'; if (plyrVideoMain) plyrVideoMain.style.display = 'none'; }
    }
});

addFavBtn.addEventListener('click', function() {
    const favorites = JSON.parse(localStorage.getItem('anime_favorites') || '[]');
    const animeData = { id: animeId, title: animeTitleDetailed.textContent, image: animePoster.src };
    const index = favorites.findIndex(f => f.id === animeData.id);
    if (index === -1) { favorites.push(animeData); this.innerHTML = '<i class="fas fa-heart"></i> تمت الإضافة'; this.style.background = 'var(--accent)'; }
    else { favorites.splice(index, 1); this.innerHTML = '<i class="fas fa-heart"></i> أضف للمفضلة'; this.style.background = ''; }
    localStorage.setItem('anime_favorites', JSON.stringify(favorites));
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('light-mode')) { icon.className = 'fas fa-sun'; localStorage.setItem('theme', 'light'); }
    else { icon.className = 'fas fa-moon'; localStorage.setItem('theme', 'dark'); }
});
if (localStorage.getItem('theme') === 'light') { document.body.classList.add('light-mode'); themeToggle.querySelector('i').className = 'fas fa-sun'; }

document.addEventListener('DOMContentLoaded', () => { createParticles(); initHeroCanvas(); loadAnimeDetails().then(() => initPosterTilt()); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeVideoPlayer(); });
