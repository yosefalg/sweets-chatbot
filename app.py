import os
from flask import Flask, request, jsonify, send_from_directory, redirect
import requests
from datetime import datetime

app = Flask(__name__, static_url_path='', static_folder='.')

# ========== إعدادات API ==========
JIKAN_BASE_URL = "https://api.jikan.moe/v4"

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/anime')
def anime_page():
    """صفحة تفاصيل الأنمي"""
    return send_from_directory('.', 'anime.html')

# ========== API: البحث عن أنمي ==========
@app.route('/api/search')
def search_anime():
    q = request.args.get('q', '')
    page = request.args.get('page', '1')
    type_filter = request.args.get('type', '')
    
    if not q:
        return jsonify({"results": []})
    
    try:
        params = {"q": q, "page": page, "limit": 20}
        if type_filter:
            params["type"] = type_filter
            
        resp = requests.get(f"{JIKAN_BASE_URL}/anime", params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        results = []
        for anime in data.get('data', []):
            results.append({
                "mal_id": anime['mal_id'],
                "title": anime['title'],
                "title_english": anime.get('title_english', ''),
                "title_japanese": anime.get('title_japanese', ''),
                "image": anime['images']['jpg']['large_image_url'] or anime['images']['jpg']['image_url'],
                "synopsis": anime.get('synopsis', ''),
                "score": anime.get('score'),
                "episodes": anime.get('episodes'),
                "type": anime.get('type'),
                "status": anime.get('status'),
                "aired": anime.get('aired', {}).get('string', ''),
                "rating": anime.get('rating', ''),
                "genres": [g['name'] for g in anime.get('genres', [])],
                "url": anime.get('url', '')
            })
        
        return jsonify({
            "results": results,
            "total": data.get('pagination', {}).get('items', {}).get('total', 0),
            "has_next": data.get('pagination', {}).get('has_next_page', False)
        })
    except Exception as e:
        print(f"Search error: {e}")
        return jsonify({"results": [], "error": str(e)}), 500

# ========== API: الأنميات الشائعة ==========
@app.route('/api/top')
def top_anime():
    page = request.args.get('page', '1')
    filter_type = request.args.get('filter', 'bypopularity')
    
    try:
        resp = requests.get(
            f"{JIKAN_BASE_URL}/top/anime",
            params={"page": page, "limit": 20, "filter": filter_type},
            timeout=10
        )
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
        
        return jsonify({
            "results": results,
            "has_next": data.get('pagination', {}).get('has_next_page', False)
        })
    except Exception as e:
        print(f"Top anime error: {e}")
        return jsonify({"results": []}), 500

# ========== API: تفاصيل أنمي ==========
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
            "title_japanese": anime.get('title_japanese', ''),
            "image": anime['images']['jpg']['large_image_url'] or anime['images']['jpg']['image_url'],
            "synopsis": anime.get('synopsis', ''),
            "background": anime.get('background', ''),
            "score": anime.get('score'),
            "rank": anime.get('rank'),
            "popularity": anime.get('popularity'),
            "members": anime.get('members'),
            "favorites": anime.get('favorites'),
            "episodes": anime.get('episodes'),
            "duration": anime.get('duration', ''),
            "type": anime.get('type'),
            "status": anime.get('status'),
            "rating": anime.get('rating', ''),
            "season": anime.get('season', ''),
            "year": anime.get('year'),
            "aired": anime.get('aired', {}).get('string', ''),
            "genres": [g['name'] for g in anime.get('genres', [])],
            "themes": [t['name'] for t in anime.get('themes', [])],
            "demographics": [d['name'] for d in anime.get('demographics', [])],
            "studios": [s['name'] for s in anime.get('studios', [])],
            "producers": [p['name'] for p in anime.get('producers', [])],
            "trailer": anime.get('trailer', {}).get('url', ''),
            "url": anime.get('url', '')
        })
    except Exception as e:
        print(f"Anime details error: {e}")
        return jsonify({"error": str(e)}), 500

# ========== API: موسم الأنمي الحالي ==========
@app.route('/api/season')
def current_season():
    year = request.args.get('year', datetime.now().year)
    season = request.args.get('season', get_current_season())
    page = request.args.get('page', '1')
    
    try:
        resp = requests.get(
            f"{JIKAN_BASE_URL}/seasons/{year}/{season}",
            params={"page": page, "limit": 20},
            timeout=10
        )
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
        
        return jsonify({"results": results, "season": season, "year": year})
    except Exception as e:
        return jsonify({"results": [], "error": str(e)}), 500

# ========== API: جدول الأنمي ==========
@app.route('/api/schedule')
def schedule():
    day = request.args.get('day', '')
    
    try:
        url = f"{JIKAN_BASE_URL}/schedules"
        params = {"limit": 20}
        if day:
            params["filter"] = day
        else:
            # اليوم الحالي
            current_day = datetime.now().strftime('%A').lower()
            params["filter"] = current_day
            
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        results = []
        for anime in data.get('data', []):
            results.append({
                "mal_id": anime['mal_id'],
                "title": anime['title'],
                "image": anime['images']['jpg']['image_url'],
                "score": anime.get('score'),
                "type": anime.get('type'),
                "status": anime.get('status')
            })
        
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"results": []}), 500

# ========== دوال مساعدة ==========
def get_current_season():
    """تحديد الموسم الحالي"""
    month = datetime.now().month
    if month in [12, 1, 2]:
        return 'winter'
    elif month in [3, 4, 5]:
        return 'spring'
    elif month in [6, 7, 8]:
        return 'summer'
    else:
        return 'fall'

# ========== معالجة الأخطاء ==========
@app.errorhandler(404)
def not_found(e):
    return send_from_directory('.', 'index.html')

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
