// ========== المتغيرات العامة ==========
let currentTab = 'popular';
let currentPage = 1;
let isLoading = false;
let animeData = {};

// ========== عناصر DOM ==========
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
const videoTitle = document.getElementById('video-title');
const closeVideo = document.getElementById('close-video');
const serverTabs = document.querySelectorAll('.server-tab');
const customUrlInput = document.getElementById('custom-url-input');
const customVideoUrl = document.getElementById('custom-video-url');
const loadCustomUrl = document.getElementById('load-custom-url');

// ========== إحصائيات العد التصاعدي ==========
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

// ========== تحميل الأنميات ==========
async function fetchAnime(type, page = 1) {
    const endpoints = {
        'popular': `https://api.jikan.moe/v4/top/anime?page=${page}&limit=20`,
        'top': `https://api.jikan.moe/v4/top/anime?page=${page}&limit=20&filter=bypopularity`,
        'airing': `https://api.jikan.moe/v4/seasons/now?page=${page}&limit=20`,
        'upcoming': `https://api.jikan.moe/v4/seasons/upcoming?page=${page}&limit=20`
    };

    try {
        const response = await fetch(endpoints[type] || endpoints['popular']);
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching anime:', error);
        return [];
    }
}

// ========== عرض الأنميات ==========
function renderAnimeCards(animeList, container) {
    container.innerHTML = '';
    
    if (animeList.length === 0) {
        container.innerHTML = '<p style="text-align:center;grid-column:1/-1;padding:50px;">لم يتم العثور على أنميات</p>';
        return;
    }

    animeList.forEach((anime, index) => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.style.animationDelay = `${index * 0.05}s`;
        card.onclick = () => window.location.href = `/anime?id=${anime.mal_id}`;

        card.innerHTML = `
            <div class="card-image">
                <img src="${anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || ''}" 
                     alt="${anime.title}" 
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x400/1e1e3a/8a2be2?text=No+Image'">
                <div class="card-overlay">
                    <div class="play-btn">
                        <i class="fas fa-play" style="color:white;"></i>
                    </div>
                </div>
                ${anime.score ? `<div class="card-badge">⭐ ${anime.score}</div>` : ''}
            </div>
            <div class="card-info">
                <h3 title="${anime.title}">${anime.title}</h3>
                <div class="card-meta">
                    <span>${anime.type || 'TV'}</span>
                    <span class="score">${anime.episodes ? anime.episodes + ' حلقة' : '؟ حلقات'}</span>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

// ========== تحميل الصفحة الرئيسية ==========
async function loadAnimeList(tab = 'popular', page = 1, append = false) {
    if (isLoading) return;
    isLoading = true;

    if (!append) {
        animeGrid.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>جاري تحميل الأنميات...</p>
            </div>
        `;
    }

    const animeList = await fetchAnime(tab, page);
    animeData[tab] = append ? [...(animeData[tab] || []), ...animeList] : animeList;
    
    renderAnimeCards(animeData[tab], animeGrid);
    isLoading = false;
}

// ========== البحث عن أنمي ==========
async function searchAnime(query) {
    if (!query.trim()) return;
    
    try {
        searchResultsContainer.style.display = 'block';
        searchResultsGrid.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>جاري البحث...</p>
            </div>
        `;
        
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            renderAnimeCards(data.results, searchResultsGrid);
            searchResultsContainer.scrollIntoView({ behavior: 'smooth' });
        } else {
            searchResultsGrid.innerHTML = '<p style="text-align:center;grid-column:1/-1;padding:50px;">لم يتم العثور على نتائج</p>';
        }
    } catch (error) {
        console.error('Search error:', error);
        searchResultsGrid.innerHTML = '<p style="text-align:center;grid-column:1/-1;padding:50px;">حدث خطأ في البحث</p>';
    }
}

// ========== مشغل الفيديو ==========
function openVideoPlayer(title, episodeNumber = 1) {
    videoTitle.textContent = title;
    videoOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // محاولة تحميل الفيديو من Gogoanime
    const searchQuery = encodeURIComponent(title);
    videoFrame.src = `https://www2.gogoanime.fi/search?keyword=${searchQuery}`;
}

function closeVideoPlayer() {
    videoOverlay.classList.remove('active');
    document.body.style.overflow = '';
    videoFrame.src = '';
}

// ========== تغيير السيرفر ==========
serverTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        serverTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        if (this.dataset.server === 'custom') {
            customUrlInput.style.display = 'flex';
        } else {
            customUrlInput.style.display = 'none';
            const title = videoTitle.textContent;
            const searchQuery = encodeURIComponent(title);
            
            if (this.dataset.server === 'gogo') {
                videoFrame.src = `https://www2.gogoanime.fi/search?keyword=${searchQuery}`;
            } else if (this.dataset.server === 'zoro') {
                videoFrame.src = `https://zoro.to/search?keyword=${searchQuery}`;
            }
        }
    });
});

// ========== تحميل رابط مخصص ==========
loadCustomUrl.addEventListener('click', () => {
    const url = customVideoUrl.value.trim();
    if (url) {
        videoFrame.src = url;
    }
});

// ========== أحداث ==========
searchBtn.addEventListener('click', () => searchAnime(searchInput.value));
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchAnime(searchInput.value);
});

closeVideo.addEventListener('click', closeVideoPlayer);
videoOverlay.addEventListener('click', (e) => {
    if (e.target === videoOverlay) closeVideoPlayer();
});

loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    loadAnimeList(currentTab, currentPage, true);
});

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

// ========== تغيير الثيم ==========
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('light-mode')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'light');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'dark');
    }
});

// تحميل الثيم المحفوظ
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.querySelector('i').className = 'fas fa-sun';
}

// ========== تحميل الصفحة ==========
document.addEventListener('DOMContentLoaded', () => {
    animateStats();
    loadAnimeList('popular', 1, false);
});

// ========== اختصارات لوحة المفاتيح ==========
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVideoPlayer();
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
});
