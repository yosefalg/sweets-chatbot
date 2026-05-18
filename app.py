import os
from flask import Flask, request, jsonify
import requests
from datetime import datetime

app = Flask(__name__)

# ========== الصفحة الكاملة (واجهة مستخدم مدمجة) ==========
HTML = """
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AnimeAI - منصة الأنمي</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        :root {
            --primary: #8a2be2;
            --accent: #ff69b4;
            --bg: #0a0a1a;
            --card: #1e1e3a;
            --text: #ffffff;
            --border: #2a2a4a;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Tajawal', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
        .navbar {
            position: sticky; top: 0; z-index: 1000;
            background: rgba(10,10,26,0.95); backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--border); padding: 10px 20px;
            display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
        }
        .nav-logo {
            display: flex; align-items: center; gap: 8px;
            font-size: 1.5rem; font-weight: 900; cursor: pointer;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .nav-links { display: flex; gap: 5px; }
        .nav-link {
            color: #a0a0c0; text-decoration: none; padding: 8px 15px;
            border-radius: 20px; font-size: 0.9rem; transition: all 0.3s;
            display: flex; align-items: center; gap: 5px;
        }
        .nav-link:hover, .nav-link.active { background: var(--card); color: var(--primary); }
        .search-box { display: flex; align-items: center; }
        .search-box input {
            padding: 10px 15px; border: 2px solid var(--border); border-radius: 25px 0 0 25px;
            outline: none; background: var(--card); color: var(--text); font-family: 'Tajawal', sans-serif; width: 250px;
        }
        .search-box button {
            padding: 10px 20px; background: var(--primary); border: none;
            border-radius: 0 25px 25px 0; color: white; cursor: pointer;
        }
        .main-content { max-width: 1400px; margin: 0 auto; padding: 30px 20px; }
        .tabs-container { display: flex; gap: 10px; margin-bottom: 30px; flex-wrap: wrap; justify-content: center; }
        .tab-btn {
            padding: 12px 25px; background: var(--card); border: 1px solid var(--border);
            color: #a0a0c0; border-radius: 25px; cursor: pointer; transition: all 0.3s;
            font-family: 'Tajawal', sans-serif; font-weight: 500; display: flex; align-items: center; gap: 8px;
        }
        .tab-btn.active { background: var(--primary); color: white; border-color: transparent; }
        .anime-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }
        .anime-card {
            background: var(--card); border-radius: 12px; overflow: hidden;
            transition: transform 0.3s; cursor: pointer; border: 1px solid var(--border);
        }
        .anime-card:hover { transform: scale(1.03); }
        .anime-card img { width: 100%; height: 250px; object-fit: cover; }
        .anime-card .info { padding: 15px; }
        .anime-card h3 { font-size: 1rem; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .anime-card .meta { display: flex; justify-content: space-between; font-size: 0.8rem; color: #a0a0c0; }
        .anime-card .score { color: #ffd700; font-weight: 700; }
        .anime-card button {
            background: var(--accent); border: none; padding: 8px 15px; border-radius: 20px;
            color: white; cursor: pointer; width: 100%; margin-top: 10px; font-weight: bold;
        }
        .player-section { margin-top: 30px; background: #12122a; padding: 20px; border-radius: 12px; display: none; }
        .player-section h2 { margin-bottom: 10px; color: var(--accent); }
        .server-selector { margin-bottom: 10px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .server-selector select, .server-selector input {
            padding: 8px; border-radius: 8px; border: 1px solid var(--border);
            background: #1a1a2e; color: white; font-family: 'Tajawal', sans-serif;
        }
        .server-selector button {
            padding: 8px 20px; background: var(--primary); border: none; border-radius: 8px; color: white; cursor: pointer;
        }
        .video-container { width: 100%; aspect-ratio: 16/9; }
        .video-container iframe { width: 100%; height: 100%; border-radius: 12px; }
        .loading-spinner { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; padding: 50px; }
        .spinner { width: 50px; height: 50px; border: 4px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="nav-logo" onclick="window.location.href='/'">
            <i class="fas fa-play-circle"></i> AnimeAI
        </div>
        <div class="nav-links">
            <a href="/" class="nav-link active"><i class="fas fa-home"></i> الرئيسية</a>
            <a href="#" class="nav-link" id="tab-popular"><i class="fas fa-fire"></i> الشائعة</a>
            <a href="#" class="nav-link" id="tab-top"><i class="fas fa-star"></i> الأعلى تقييماً</a>
            <a href="#" class="nav-link" id="tab-airing"><i class="fas fa-tv"></i> قيد العرض</a>
        </div>
        <div class="search-box">
            <input type="text" id="search-input" placeholder="ابحث عن أنمي...">
            <button id="search-btn"><i class="fas fa-search"></i></button>
        </div>
    </nav>

    <main class="main-content">
        <div class="tabs-container">
            <button class="tab-btn active" data-tab="popular"><i class="fas fa-fire"></i> الأكثر شعبية</button>
            <button class="tab-btn" data-tab="top"><i class="fas fa-star"></i> الأعلى تقييماً</button>
            <button class="tab-btn" data-tab="airing"><i class="fas fa-tv"></i> قيد العرض</button>
            <button class="tab-btn" data-tab="upcoming"><i class="fas fa-clock"></i> قريباً</button>
        </div>
        <div class="anime-grid" id="anime-grid">
            <div class="loading-spinner"><div class="spinner"></div><p>جاري التحميل...</p></div>
        </div>
        <div style="text-align:center; margin: 30px 0;">
            <button id="load-more-btn" style="padding:12px 30px; background:var(--card); border:1px solid var(--border); color:white; border-radius:25px; cursor:pointer;">عرض المزيد</button>
        </div>
        <div class="player-section" id="player-section">
            <h2 id="player-title"></h2>
            <div class="server-selector">
                <label>اختر السيرفر:</label>
                <select id="server-select">
                    <option value="2embed">2embed</option>
                    <option value="vidlink">VidLink</option>
                    <option value="vidsrc">VidSrc</option>
                    <option value="custom">رابط مخصص</option>
                </select>
                <input type="text" id="custom-url" placeholder="الصق رابط الفيديو المباشر" style="display:none;">
                <button id="load-video">تشغيل</button>
            </div>
            <div class="video-container"><iframe id="video-frame" src="" allowfullscreen></iframe></div>
        </div>
    </main>

    <script>
        // ========== متغيرات ==========
        let currentTab = 'popular';
        let currentPage = 1;
        let currentMalId = null;

        const animeGrid = document.getElementById('anime-grid');
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        const playerSection = document.getElementById('player-section');
        const videoFrame = document.getElementById('video-frame');
        const loadMoreBtn = document.getElementById('load-more-btn');

        // ========== تحميل الأنميات ==========
        async function fetchAnime(type, page = 1) {
            const endpoints = {
                popular: `https://api.jikan.moe/v4/top/anime?page=${page}&limit=20`,
                top: `https://api.jikan.moe/v4/top/anime?page=${page}&limit=20&filter=bypopularity`,
                airing: `https://api.jikan.moe/v4/seasons/now?page=${page}&limit=20`,
                upcoming: `https://api.jikan.moe/v4/seasons/upcoming?page=${page}&limit=20`
            };
            const resp = await fetch(endpoints[type] || endpoints.popular);
            const data = await resp.json();
            return data.data || [];
        }

        function renderCards(animeList) {
            animeGrid.innerHTML = '';
            if (!animeList.length) {
                animeGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;">لا توجد نتائج</p>';
                return;
            }
            animeList.forEach(anime => {
                const card = document.createElement('div');
                card.className = 'anime-card';
                card.innerHTML = `
                    <img src="${anime.images.jpg.image_url}" alt="${anime.title}" onerror="this.src='https://via.placeholder.com/300x400/1e1e3a/8a2be2?text=No+Image'">
                    <div class="info">
                        <h3>${anime.title}</h3>
                        <div class="meta">
                            <span>${anime.type || 'TV'}</span>
                            <span class="score">⭐ ${anime.score || '?'}</span>
                        </div>
                        <button onclick="event.stopPropagation(); openPlayer(${anime.mal_id}, '${anime.title.replace(/'/g, "\\'")}')">▶ شاهد</button>
                    </div>`;
                card.onclick = () => window.location.href = `/anime?id=${anime.mal_id}`;
                animeGrid.appendChild(card);
            });
        }

        async function loadTab(tab, page = 1) {
            animeGrid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>جاري التحميل...</p></div>';
            const list = await fetchAnime(tab, page);
            renderCards(list);
        }

        // ========== أحداث التبويب ==========
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentTab = this.dataset.tab;
                currentPage = 1;
                loadTab(currentTab, currentPage);
            });
        });

        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            loadTab(currentTab, currentPage);
        });

        // ========== البحث ==========
        async function searchAnime(query) {
            if (!query.trim()) return;
            const resp = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await resp.json();
            renderCards(data.results);
        }

        searchBtn.addEventListener('click', () => searchAnime(searchInput.value));
        searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') searchAnime(searchInput.value); });

        // ========== مشغل الفيديو ==========
        function openPlayer(malId, title) {
            currentMalId = malId;
            playerSection.style.display = 'block';
            document.getElementById('player-title').textContent = title;
            loadVideo('2embed', 1);
        }

        function loadVideo(server, episode = 1) {
            const urls = {
                '2embed': `https://www.2embed.skin/embed/anime/mal/${currentMalId}/${episode}`,
                'vidlink': `https://vidlink.pro/anime/${currentMalId}/${episode}/sub`,
                'vidsrc': `https://vidsrc.xyz/embed/anime?mal_id=${currentMalId}&episode=${episode}`
            };
            const custom = document.getElementById('custom-url').value;
            videoFrame.src = server === 'custom' && custom ? custom : urls[server] || urls['2embed'];
        }

        document.getElementById('load-video').addEventListener('click', () => {
            loadVideo(document.getElementById('server-select').value);
        });

        document.getElementById('server-select').addEventListener('change', function() {
            document.getElementById('custom-url').style.display = this.value === 'custom' ? 'inline-block' : 'none';
        });

        // ========== تحميل أولي ==========
        loadTab('popular', 1);
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return HTML

# ========== API ==========
JIKAN_BASE_URL = "https://api.jikan.moe/v4"

@app.route('/api/search')
def search_anime():
    q = request.args.get('q', '')
    if not q:
        return jsonify({"results": []})
    try:
        resp = requests.get(f"{JIKAN_BASE_URL}/anime", params={"q": q, "limit": 10}, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        results = []
        for anime in data.get('data', []):
            results.append({
                "mal_id": anime['mal_id'],
                "title": anime['title'],
                "image": anime['images']['jpg']['image_url'],
                "synopsis": anime.get('synopsis', ''),
                "score": anime.get('score'),
                "episodes": anime.get('episodes'),
                "type": anime.get('type')
            })
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"results": [], "error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
