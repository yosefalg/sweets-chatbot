import os
from flask import Flask, request, jsonify, send_from_directory
import requests

app = Flask(__name__, static_folder='.', static_url_path='')

# المفتاح (موجود مباشرة - اجعل هذا الملف آمناً، لا تجعله عاماً)
CURSOR_API_KEY = "crsr_375c31c356a7c47608283cbd7a96b0a5d842d015bfdb06671c25891f0faa847e"

# استبدل هذا الرابط بالرابط الصحيح من Cursor API عندما تجده
CURSOR_API_URL = "https://api.cursor.sh/agent/v1/chat"

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '').strip()

    system_prompt = (
        "أنت خبير أنمي متحمس وودود. مهمتك: "
        "1. توصية الزوار بأفضل الأنميات حسب النوع الذي يطلبونه (أكشن، رومانسي، رعب، إيسيكاي، شونين...). "
        "2. تقديم تقييمات دقيقة ونبذة عن الأنمي المطلوب. "
        "3. التحدث بلغة عربية فصيحة مبسطة مع لمسة من الحماس (مثل: 'رائع! ستعشق هذا الأنمي!'). "
        "4. اقتراح أنميات مشابهة إذا طلب الزائر. "
        "5. إذا سألك عن شيء خارج عالم الأنمي، اعتذر بلطف وارجع به للموضوع. "
        "تذكر: أنت مصدر موثوق وممتع لكل ما يتعلق بالأنمي!"
    )

    headers = {
        "Authorization": f"Bearer {CURSOR_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.8,
        "max_tokens": 600
    }

    try:
        resp = requests.post(CURSOR_API_URL, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        result = resp.json()
        reply = result.get("choices", [{}])[0].get("message", {}).get("content", "لم أستطع الإجابة")
        return jsonify({"reply": reply})
    except Exception as e:
        print("Error:", e)
        return jsonify({"reply": "عذراً، حدث خطأ."}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port) 
