import os
from flask import Flask, request, jsonify, send_from_directory, redirect
import requests
from datetime import datetime

app = Flask(__name__, static_url_path='/static', static_folder='static')

JIKAN_BASE_URL = "https://api.jikan.moe/v4"

# ========== سيرفرات التشغيل المتعددة ==========
STREAM_SERVERS = {
    "2embed": "https://www.2embed.skin/embed/anime/mal/{mal_id}/{episode}",
    "vidlink": "https://vidlink.pro/anime/{mal_id}/{episode}/sub",
    "vidsrc": "https://vidsrc.xyz/embed/anime?mal_id={mal_id}&episode={episode}",
    "vidcdn": "https://vidcdn.xyz/embed/{mal_id}/{episode}",
    "animeapi": "https://anime-api.xyz/watch/{mal_id}/{episode}"
}

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/anime')
def anime_page():
    return send_from_directory('static', 'anime.html')

@app.route('/robots.txt')
def robots():
    return send_from_directory('static', 'robots.txt')

@app.route('/sitemap.xml')
def sitemap():
    return send_from_directory('static', 'sitemap.xml')

@app.route('/manifest.json')
def manifest():
    return send_from_directory('static', 'manifest.json')

@app.route('/service-worker.js')
def service_worker():
    return send_from_directory('static', 'service-worker.js')

@app.route('/api/analytics', methods=['POST'])
def analytics():
    data = request.get_json()
    event = data.get('event', '')
    event_data = data.get('data', {})
    print(f"[Analytics] {event}: {event_data}")
    return jsonify({"status": "ok"})

@app.route('/api/servers')
def get_servers():
    """إرجاع قائمة السيرفرات المتاحة"""
    return jsonify({
        "servers": [
            {"id": "2embed", "name": "2embed", "icon": "fa-play"},
            {"id": "vidlink", "name": "VidLink", "icon": "fa-link"},
            {"id": "vidsrc", "name": "VidSrc", "icon": "fa-video"},
            {"id": "vidcdn", "name": "VidCDN", "icon": "fa-cloud"},
            {"id": "animeapi", "name": "AnimeAPI", "icon": "fa-server"},
            {"id": "custom", "name": "رابط مخصص", "icon": "fa-upload"}
        ]
    })

@app.route('/api/stream')
def stream_episode():
    """توجيه إلى سيرفر التشغيل المختار"""
    mal_id = request.args.get('mal_id', '1')
    episode = request.args.get('episode', '1')
    server = request.args.get('server', '2embed')
    
    if server in STREAM_SERVERS:
        embed_url = STREAM_SERVERS[server].format(mal_id=mal_id, episode=episode)
        return redirect(embed_url, code=302)
    return jsonify({"error": "سيرفر غير معروف"}), 400

@app.route('/api/search')
def search_anime():
    q = request.args.get('q', '')
    page = request.args.get('page', '1')
    if not q:
        return jsonify({"results": []})
    try:
        params = {"q": q, "page": page, "limit": 20}
        resp = requests.get(f"{JIKAN_BASE_URL}/anime", params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        results = []
        for anime in data.get('data', []):
            results.append({
                "mal_id": anime['mal_id'],
                "title": anime['title'],
                "title_english": anime.get('title_english', ''),
                "image": anime['images']['jpg']['large_image_url'] or anime['images']['jpg']['image_url'],
                "synopsis": anime.get('synopsis', ''),
                "score": anime.get('score'),
                "episodes": anime.get('episodes'),
                "type": anime.get('type'),
                "status": anime.get('status'),
                "genres": [g['name'] for g in anime.get('genres', [])]
            })
        return jsonify({"results": results, "total": data.get('pagination', {}).get('items', {}).get('total', 0)})
    except Exception as e:
        return jsonify({"results": [], "error": str(e)}), 500

@app.route('/api/top')
def top_anime():
    page = request.args.get('page', '1')
    filter_type = request.args.get('filter', 'bypopularity')
    try:
        resp = requests.get(f"{JIKAN_BASE_URL}/top/anime", params={"page": page, "limit": 20, "filter": filter_type}, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        results = []
        for anime in data.get('data', []):
            results.append({
                "mal_id": anime['mal_id'],
                "title": anime['title'],
                "title_english": anime.get('title_english', ''),
                "image": anime['images']['jpg']['large_image_url'] or anime['images']['jpg']['image_url'],
                "score": anime.get('score'),
                "episodes": anime.get('episodes'),
                "type": anime.get('type'),
                "status": anime.get('status'),
                "rank": anime.get('rank'),
                "genres": [g['name'] for g in anime.get('genres', [])]
            })
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"results": []}), 500

@app.route('/api/anime/<int:anime_id>')
def anime_details(anime_id):
    try:
        resp = requests.get(f"{JIKAN_BASE_URL}/anime/{anime_id}/full", timeout=10)
        resp.raise_for_status()
        anime = resp.json()['data']
        return jsonify({
            "mal_id": anime['mal_id'],
            "title": anime['title'],
            "title_english": anime.get('title_english', ''),
            "image": anime['images']['jpg']['large_image_url'] or anime['images']['jpg']['image_url'],
            "synopsis": anime.get('synopsis', ''),
            "score": anime.get('score'),
            "rank": anime.get('rank'),
            "popularity": anime.get('popularity'),
            "members": anime.get('members'),
            "episodes": anime.get('episodes'),
            "duration": anime.get('duration', ''),
            "type": anime.get('type'),
            "status": anime.get('status'),
            "aired": anime.get('aired', {}).get('string', ''),
            "genres": [g['name'] for g in anime.get('genres', [])],
            "studios": [s['name'] for s in anime.get('studios', [])],
            "trailer": anime.get('trailer', {}).get('url', '')
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/season')
def current_season():
    year = request.args.get('year', datetime.now().year)
    season = request.args.get('season', '')
    if not season:
        month = datetime.now().month
        season = 'winter' if month in [12, 1, 2] else 'spring' if month in [3, 4, 5] else 'summer' if month in [6, 7, 8] else 'fall'
    try:
        resp = requests.get(f"{JIKAN_BASE_URL}/seasons/{year}/{season}", params={"limit": 20}, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        results = []
        for anime in data.get('data', []):
            results.append({
                "mal_id": anime['mal_id'],
                "title": anime['title'],
                "image": anime['images']['jpg']['large_image_url'] or anime['images']['jpg']['image_url'],
                "score": anime.get('score'),
                "episodes": anime.get('episodes'),
                "type": anime.get('type'),
                "genres": [g['name'] for g in anime.get('genres', [])]
            })
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"results": []}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
