// ========== مرجع VidLink ==========
const VIDLINK_BASE = "https://vidlink.pro/anime";

// ========== استخراج ID الأنمي من الرابط ==========
const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('id');
let currentAnimeTitle = '';
let currentMalId = null;

// ========== عناصر DOM ==========
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
const videoTitle = document.getElementById('video-title');
const closeVideo = document.getElementById('close-video');
const themeToggle = document.getElementById('theme-toggle');
const episodeSearch = document.getElementById('episode-search');
const episodeSort = document.getElementById('episode-sort');
const watchFirstBtn = document.getElementById('watch-first-episode');
const addFavBtn = document.getElementById('add-to-favorites');

// ========== تحميل بيانات الأنمي ==========
async function loadAnimeDetails() {
    if (!animeId) {
        window.location.href = '/';
        return;
    }

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
        if (anime.genres) {
            anime.genres.forEach(genre => {
                const tag = document.createElement('span');
                tag.className = 'genre-tag';
                tag.textContent = genre.name;
                animeGenres.appendChild(tag);
            });
        }

        loadEpisodes(anime.episodes || 0);

        // زر شاهد الحلقة الأولى
        watchFirstBtn.onclick = () => openVideoPlayer(currentMalId || animeId, 1);

    } catch (error) {
        console.error('Error loading anime details:', error);
        alert('حدث خطأ في تحميل بيانات الأنمي');
    }
}

// ========== إنشاء قائمة الحلقات ==========
function loadEpisodes(totalEpisodes) {
    episodesGrid.innerHTML = '';
    if (totalEpisodes === 0) {
        episodesGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;">عدد الحلقات غير معروف</p>';
        return;
    }
    for (let i = 1; i <= Math.min(totalEpisodes, 100); i++) {
        const btn = document.createElement('button');
        btn.className = 'episode-btn';
        btn.textContent = `حلقة ${i}`;
        btn.onclick = () => openVideoPlayer(currentMalId || animeId, i);
        episodesGrid.appendChild(btn);
    }
}

// ========== فلترة وترتيب الحلقات ==========
episodeSearch.addEventListener('input', function() {
    const query = this.value.toLowerCase();
    document.querySelectorAll('.episode-btn').forEach(btn => {
        btn.style.display = btn.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
});

episodeSort.addEventListener('change', function() {
    const buttons = Array.from(document.querySelectorAll('.episode-btn'));
    buttons.sort((a, b) => {
        const numA = parseInt(a.textContent.replace('حلقة ', ''));
        const numB = parseInt(b.textContent.replace('حلقة ', ''));
        return this.value === 'desc' ? numB - numA : numA - numB;
    });
    episodesGrid.innerHTML = '';
    buttons.forEach(btn => episodesGrid.appendChild(btn));
});

// ========== 🎬 مشغل الفيديو (VidLink API) ==========
function openVideoPlayer(malId, episodeNumber) {
    const subOrDub = 'sub'; // ترجمة افتراضياً
    const title = currentAnimeTitle || 'الأنمي';
    const embedUrl = `${VIDLINK_BASE}/${malId}/${episodeNumber}/${subOrDub}?primaryColor=8a2be2&secondaryColor=1e1e3a&iconColor=ff69b4&icons=vid&title=true&autoplay=true`;

    videoTitle.textContent = `${title} - الحلقة ${episodeNumber}`;
    videoFrame.src = embedUrl;
    videoOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeVideoPlayer() {
    videoOverlay.classList.remove('active');
    document.body.style.overflow = '';
    videoFrame.src = '';
}

closeVideo.addEventListener('click', closeVideoPlayer);
videoOverlay.addEventListener('click', (e) => {
    if (e.target === videoOverlay) closeVideoPlayer();
});

// ========== تغيير السيرفر ==========
document.querySelectorAll('.server-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.server-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const customInput = document.getElementById('custom-url-input');
        if (this.dataset.server === 'custom') {
            customInput.style.display = 'flex';
        } else {
            customInput.style.display = 'none';
            // الإبقاء على VidLink (أو إضافة مزودين آخرين)
        }
    });
});

document.getElementById('load-custom-url').addEventListener('click', () => {
    const url = document.getElementById('custom-video-url').value.trim();
    if (url) videoFrame.src = url;
});

// ========== المفضلة ==========
addFavBtn.addEventListener('click', function() {
    const favorites = JSON.parse(localStorage.getItem('anime_favorites') || '[]');
    const animeData = {
        id: animeId,
        title: animeTitleDetailed.textContent,
        image: animePoster.src
    };
    const index = favorites.findIndex(f => f.id === animeData.id);
    if (index === -1) {
        favorites.push(animeData);
        this.innerHTML = '<i class="fas fa-heart"></i> تمت الإضافة';
        this.style.background = 'var(--accent)';
    } else {
        favorites.splice(index, 1);
        this.innerHTML = '<i class="fas fa-heart"></i> أضف للمفضلة';
        this.style.background = '';
    }
    localStorage.setItem('anime_favorites', JSON.stringify(favorites));
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
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.querySelector('i').className = 'fas fa-sun';
}

// ========== تحميل الصفحة ==========
document.addEventListener('DOMContentLoaded', loadAnimeDetails);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVideoPlayer();
});
