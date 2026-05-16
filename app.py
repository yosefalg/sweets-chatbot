# app.py
import os
from flask import Flask, request, jsonify, send_from_directory
import requests

app = Flask(__name__, static_folder='.', static_url_path='')

# ⚠️ المفتاح مكشوف هنا (للاستخدام المحلي فقط)
CURSOR_API_KEY = "crsr_375c31c356a7c47608283cbd7a96b0a5d842d015bfdb06671c25891f0faa847e"

# ⚠️ هذا الرابط تجريبي، استبدله بالرابط الحقيقي من وثائق Cursor Agent API
CURSOR_API_URL = "https://api.cursor.sh/agent/v1/chat"  # مثال، غيره عند الحاجة

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '').strip()

    if not user_message:
        return jsonify({"reply": "من فضلك اكتب سؤالاً."}), 400

    system_prompt = (
        "أنت مساعد ودود ومحترف في متجر حلويات الأنس. مهمتك: استقبال الزبائن، "
        "التوصية بأفضل الحلويات، الإجابة عن المكونات، الأسعار، والعروض. "
        "تستخدم لغة عربية فصحى مبسطة ومهذبة، وتضيف لمسة من المرح. "
        "إذا سأل الزبون عن شيء خارج نطاق الحلويات، اعتذر بلطف وأعده للموضوع."
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
        # قد تحتاج لتغيير طريقة الاستخراج حسب وثائق Cursor
        reply = result.get("choices", [{}])[0].get("message", {}).get("content", "لم أستطع الإجابة")
        return jsonify({"reply": reply})
    except requests.exceptions.RequestException as e:
        print("API Error:", e)
        return jsonify({"reply": "عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً. حاول لاحقاً."}), 503
    except Exception as e:
        print("Server Error:", e)
        return jsonify({"reply": "حدث خطأ غير متوقع."}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
