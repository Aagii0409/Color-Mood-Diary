# -*- coding: utf-8 -*-
import json
import os
from datetime import date, datetime
from flask import Flask, jsonify, render_template, request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'diary_data.json')

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False
app.config['TEMPLATES_AUTO_RELOAD'] = True

MOODS = [
    {"key": "happy", "label": "Аз жаргалтай", "emoji": "😊", "color": "#F6D365", "helper": "Өнөөдөр дотроос чинь гэрэл цацарч байна"},
    {"key": "calm", "label": "Тайван", "emoji": "😌", "color": "#A8D8EA", "helper": "Нэг л нам гүм, зөөлөн өдөр"},
    {"key": "excited", "label": "Сэтгэл догдолсон", "emoji": "🤩", "color": "#F7B267", "helper": "Ямар нэг гоё зүйл мэдрэгдэж байна"},
    {"key": "tired", "label": "Ядарсан", "emoji": "😴", "color": "#B8B8C6", "helper": "Амрах хэрэгтэй өдөр байна"},
    {"key": "sad", "label": "Гунигтай", "emoji": "😢", "color": "#7DA7D9", "helper": "Өөртөө зөөлөн хандах өдөр"},
    {"key": "angry", "label": "Ууртай", "emoji": "😡", "color": "#F28482", "helper": "Дотор нэг л хүндхэн байна"},
    {"key": "anxious", "label": "Түгшсэн", "emoji": "😰", "color": "#CDB4DB", "helper": "Амьсгаагаа тайван аваарай"},
    {"key": "neutral", "label": "Энгийн", "emoji": "😐", "color": "#DDD6CE", "helper": "Зүгээр, энгийн өдөр"},
]

TAGS = ["Амралт", "Ажил", "Гэр бүл", "Найз", "Сургууль", "Эрүүл мэнд", "Гадуур", "Гэртээ"]
WEEKDAYS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"]
MONTHS = [
    "Нэгдүгээр сар", "Хоёрдугаар сар", "Гуравдугаар сар", "Дөрөвдүгээр сар",
    "Тавдугаар сар", "Зургаадугаар сар", "Долоодугаар сар", "Наймдугаар сар",
    "Есдүгээр сар", "Аравдугаар сар", "Арваннэгдүгээр сар", "Арванхоёрдугаар сар",
]


def load_entries():
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, list):
            return data
    except Exception:
        pass
    return []


def save_entries(entries):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)


def find_entry(entries, entry_date):
    for item in entries:
        if item.get('entry_date') == entry_date:
            return item
    return None


@app.get('/')
def index():
    today = date.today().isoformat()
    return render_template(
        'index.html',
        moods=MOODS,
        tags=TAGS,
        weekdays=WEEKDAYS,
        months=MONTHS,
        today=today,
        entries=load_entries(),
    )


@app.get('/api/entries')
def get_entries():
    return app.response_class(
        response=json.dumps(load_entries(), ensure_ascii=False),
        status=200,
        mimetype='application/json; charset=utf-8',
    )


@app.post('/api/save')
def save_entry():
    payload = request.get_json(silent=True) or {}
    entry_date = str(payload.get('entry_date', '')).strip()
    mood_key = str(payload.get('mood_key', '')).strip()
    note = str(payload.get('note', '')).strip()
    tags = payload.get('tags', [])
    intensity = payload.get('intensity', 3)

    if not entry_date:
        return jsonify({"ok": False, "message": "Өдрөө сонгоно уу."}), 400
    if mood_key not in {m['key'] for m in MOODS}:
        return jsonify({"ok": False, "message": "Юу мэдэрч байгаагаа нэгийг сонгоно уу."}), 400

    try:
        datetime.strptime(entry_date, '%Y-%m-%d')
    except ValueError:
        return jsonify({"ok": False, "message": "Өдрийн формат буруу байна."}), 400

    try:
        intensity = max(1, min(5, int(intensity)))
    except Exception:
        intensity = 3

    safe_tags = [t for t in tags if t in TAGS][:2]

    entries = load_entries()
    entry = find_entry(entries, entry_date)
    if entry:
        entry['mood_key'] = mood_key
        entry['note'] = note
        entry['intensity'] = intensity
        entry['tags'] = safe_tags
        entry.setdefault('reflections', [])
    else:
        entries.append({
            'entry_date': entry_date,
            'mood_key': mood_key,
            'note': note,
            'intensity': intensity,
            'tags': safe_tags,
            'reflections': [],
        })

    entries.sort(key=lambda x: x['entry_date'])
    save_entries(entries)
    return jsonify({"ok": True, "message": "Хадгалагдлаа ✨", "entries": entries})


@app.post('/api/reflection')
def add_reflection():
    payload = request.get_json(silent=True) or {}
    entry_date = str(payload.get('entry_date', '')).strip()
    text = str(payload.get('text', '')).strip()

    if not entry_date or not text:
        return jsonify({"ok": False, "message": "Эргэн бодлоо бичээд хадгална уу."}), 400

    entries = load_entries()
    entry = find_entry(entries, entry_date)
    if not entry:
        return jsonify({"ok": False, "message": "Энэ өдөрт эхлээд тэмдэглэл хадгална уу."}), 404

    entry.setdefault('reflections', []).append({
        'date': date.today().isoformat(),
        'text': text,
    })
    save_entries(entries)
    return jsonify({"ok": True, "message": "Эргэн бодол нэмэгдлээ 💬", "entries": entries})


if __name__ == '__main__':
    app.run(debug=True)
