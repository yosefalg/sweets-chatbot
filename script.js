let currentTab = 'popular';
let currentPage = 1;
let isLoading = false;
let animeData = {};
let player = null;
let currentMalId = 1;
let currentEpisode = 1;
let availableServers = [];

const animeGrid = document.getElementById('anime-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResultsContainer = document.getElementById('search-results-container');
const searchResultsGrid = document.getElementById('search-results-grid');
const loadMoreBtn = document.getElementById('load-more-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const themeToggle = document.getElementById('theme-toggle');
const videoOverlay = document.getElementById('video-overlay');
const videoFrame = document.getElementById('video-frame');
const plyrVideoMain = document.getElementById('plyr-video-main');
const videoTitle = document.getElementById('video-title');
const closeVideo = document.getElementById('close-video');
const pipBtn = document.getElementById('pip-btn');
const serverTabsContainer = document.getElementById('server-tabs');
const customUrlInput = document.getElementById('custom-url-input');
const customVideoUrl = document.getElementById('custom-video-url');
const loadCustomUrl = document.getElementById('load-custom-url');

// تحميل السيرفرات المتاحة
async function loadServers() {
    try {
        const resp = await fetch('/api/servers');
        const data = await resp.json();
        availableServers = data.servers || [];
    } catch (e) {
        availableServers = [
            {id: "2embed", name: "2embed", icon: "fa-play"},
            {id: "vidlink", name: "VidLink", icon: "fa-link"},
            {id: "vidsrc", name: "VidSrc", icon: "fa-video"},
            {id: "custom", name: "رابط مخصص", icon: "fa-upload"}
        ];
    }
}

function renderServerTabs(activeServer = '2embed') {
    if (!serverTabsContainer) return;
    serverTabsContainer.innerHTML = '';
    availableServers.forEach(server => {
        const btn = document.createElement('button');
        btn.className = 'server-tab' + (server.id === activeServer ? ' active' : '');
        btn.dataset.server = server.id;
        btn.innerHTML = `<i class="fas ${server.icon || 'fa-server'}"></i> ${server.name}`;
        btn.addEventListener('click', function() {
            document.querySelectorAll('.server-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            if (this.dataset.server === 'custom') {
                customUrlInput.style.display = 'flex';
            } else {
                customUrlInput.style.display = 'none';
                changeServer(this.dataset.server);
            }
        });
        serverTabsContainer.appendChild(btn);
    });
}

function changeServer(serverId) {
    if (serverId === 'custom') return;
    const embedUrl = `/api/stream?mal_id=${currentMalId}&episode=${currentEpisode}&server=${serverId}`;
    videoFrame.src = embedUrl;
    videoFrame.style.display = 'block';
    if (plyrVideoMain) plyrVideoMain.style.display = 'none';
}

function createParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 4 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = Math.random() * 15 + 10 + 's';
        particle.style.animationDelay = Math.random() * 10 + 's';
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
    for (let i = 0; i < 80; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 1,
            speed: Math.random() * 0.5 + 0.2,
            opacity: Math.random() * 0.5 + 0.3
        });
    }
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.y -= p.speed;
            if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(138, 43, 226, ${p.opacity})`;
            ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();
}

function animateStats() {
    document.querySelectorAll('.stat-number').forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        const updateCounter = () => {
            current += step;
            if (current < target) {
                stat.textContent = Math.floor(current).toLocaleString() + '+';
                requestAnimationFrame(updateCounter);
            } else {
                stat.textContent = target.toLocaleString() + '+';
            }
        };
        updateCounter();
    });
}

function initScrollReveal() {
    const elements = document.querySelectorAll('.anime-card, .section-title, .load-more-btn');
    elements.forEach(el => el.classList.add('reveal'));
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    elements.forEach(el => observer.observe(el));
}

async function fetchAnime(type, page = 1) {
    const endpoints = {
        popular: `https://api.jikan.moe/v4/top/anime?page=${page}&limit=20`,
        top: `https://api.jikan.moe/v4/top/anime?page=${page}&limit=20&filter=bypopularity`,
        airing: `https://api.jikan.moe/v4/seasons/now?page=${page}&limit=20`,
        upcoming: `https://api.jikan.moe/v4/seasons/upcoming?page=${page}&limit=20`
    };
    try {
        const response = await fetch(endpoints[type] || endpoints.popular);
        const data = await response.json();
        return data.data || [];
    } catch (error) { return []; }
}

function renderAnimeCards(animeList, container) {
    container.innerHTML = '';
    if (animeList.length === 0) {
        container.innerHTML = '<p style="text-align:center;grid-column:1/-1;padding:50px;">لم يتم العثور على أنميات</p>';
        return;
    }
    animeList.forEach((anime, index) => {
        const card = document.createElement('div');
        card.className = 'anime-card reveal fade-in-up';
        card.style.animationDelay = `${index * 0.05}s`;
        card.onclick = () => { window.location.href = `/anime?id=${anime.mal_id}`; if (typeof Analytics !== 'undefined') Analytics.trackAnimeClick(anime.mal_id, anime.title); };
        card.innerHTML = `
            <div class="card-image">
                <img src="${anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || ''}" alt="${anime.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x400/1e1e3a/8a2be2?text=No+Image'">
                <div class="card-overlay"><div class="play-btn"><i class="fas fa-play" style="color:white;"></i></div></div>
                ${anime.score ? `<div class="card-badge">⭐ ${anime.score}</div>` : ''}
            </div>
            <div class="card-info">
                <h3 title="${anime.title}">${anime.title}</h3>
                <div class="card-meta"><span>${anime.type || 'TV'}</span><span class="score">${anime.episodes ? anime.episodes + ' حلقة' : '؟ حلقات'}</span></div>
            </div>`;
        container.appendChild(card);
    });
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(container.querySelectorAll('.anime-card'), { max: 15, speed: 400, glare: true, 'max-glare': 0.3, scale: 1.05 });
    }
    initScrollReveal();
}

async function loadAnimeList(tab = 'popular', page = 1, append = false) {
    if (isLoading) return;
    isLoading = true;
    if (!append) animeGrid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>جاري تحميل الأنميات...</p></div>';
    const animeList = await fetchAnime(tab, page);
    animeData[tab] = append ? [...(animeData[tab] || []), ...animeList] : animeList;
    renderAnimeCards(animeData[tab], animeGrid);
    isLoading = false;
}

async function searchAnime(query) {
    if (!query.trim()) return;
    searchResultsContainer.style.display = 'block';
    searchResultsGrid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>جاري البحث...</p></div>';
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            renderAnimeCards(data.results, searchResultsGrid);
            searchResultsContainer.scrollIntoView({ behavior: 'smooth' });
        } else {
            searchResultsGrid.innerHTML = '<p style="text-align:center;grid-column:1/-1;padding:50px;">لم يتم العثور على نتائج</p>';
        }
    } catch (error) {
        searchResultsGrid.innerHTML = '<p style="text-align:center;grid-column:1/-1;padding:50px;">حدث خطأ في البحث</p>';
    }
}

function openVideoPlayer(title, malId = 1, episodeNumber = 1) {
    currentMalId = malId;
    currentEpisode = episodeNumber;
    videoTitle.textContent = `${title} - الحلقة ${episodeNumber}`;
    
    const activeServer = document.querySelector('.server-tab.active');
    const serverId = activeServer ? activeServer.dataset.server : '2embed';
    
    if (serverId === 'custom') {
        customUrlInput.style.display = 'flex';
        videoFrame.src = '';
    } else {
        const embedUrl = `/api/stream?mal_id=${malId}&episode=${episodeNumber}&server=${serverId}`;
        videoFrame.src = embedUrl;
        videoFrame.style.display = 'block';
        if (plyrVideoMain) plyrVideoMain.style.display = 'none';
    }
    
    videoOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    if (player) { player.destroy(); player = null; }
}

function playDirectUrl(url) {
    videoFrame.style.display = 'none';
    if (plyrVideoMain) {
        plyrVideoMain.style.display = 'block';
        plyrVideoMain.innerHTML = '';
        const source = document.createElement('source');
        source.src = url;
        plyrVideoMain.appendChild(source);
        if (player) player.destroy();
        player = new Plyr(plyrVideoMain, {
            controls: ['play-large','play','progress','current-time','mute','volume','captions','settings','pip','airplay','fullscreen'],
            autoplay: true,
            tooltips: { controls: true, seek: true },
            hideControls: false,
            fullscreen: { enabled: true, fallback: true, iosNative: true },
            ratio: '16:9'
        });
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

pipBtn.addEventListener('click', async () => {
    const video = document.querySelector('video');
    if (video && video !== plyrVideoMain) {
        if (document.pictureInPictureElement) { await document.exitPictureInPicture(); }
        else { await video.requestPictureInPicture(); }
    }
});

loadCustomUrl.addEventListener('click', () => {
    const url = customVideoUrl.value.trim();
    if (url) {
        if (/\.(mp4|webm|ogg|m3u8|mpd)(\?.*)?$/i.test(url) || url.includes('youtube.com') || url.includes('vimeo.com')) {
            playDirectUrl(url);
        } else {
            videoFrame.src = url;
            videoFrame.style.display = 'block';
            if (plyrVideoMain) plyrVideoMain.style.display = 'none';
        }
    }
});

searchBtn.addEventListener('click', () => searchAnime(searchInput.value));
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchAnime(searchInput.value); });
closeVideo.addEventListener('click', closeVideoPlayer);
videoOverlay.addEventListener('click', (e) => { if (e.target === videoOverlay) closeVideoPlayer(); });
loadMoreBtn.addEventListener('click', () => { currentPage++; loadAnimeList(currentTab, currentPage, true); });
tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        tabBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentTab = this.dataset.tab;
        currentPage = 1;
        animeData[currentTab] = [];
        loadAnimeList(currentTab, currentPage, false);
    });
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('light-mode')) {
        icon.className = 'fas fa-sun'; localStorage.setItem('theme', 'light');
    } else {
        icon.className = 'fas fa-moon'; localStorage.setItem('theme', 'dark');
    }
});
if (localStorage.getItem('theme') === 'light') { document.body.classList.add('light-mode'); themeToggle.querySelector('i').className = 'fas fa-sun'; }

document.addEventListener('DOMContentLoaded', async () => {
    createParticles();
    initHeroCanvas();
    animateStats();
    await loadServers();
    renderServerTabs('2embed');
    loadAnimeList('popular', 1, false);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeVideoPlayer(); if (e.ctrlKey && e.key === 'k') { e.preventDefault(); searchInput.focus(); } });
