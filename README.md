# Өнгөт өдрүүд v7

## Ажиллуулах

### 1) Орчин үүсгээд ажиллуулах
```bash
python -m venv venv
```

Windows:
```bash
venv\Scripts\activate
```

Mac / Linux:
```bash
source venv/bin/activate
```

### 2) Хамаарлууд суулгах
```bash
pip install -r requirements.txt
```

### 3) App ажиллуулах
```bash
python app.py
```

Browser дээр:
```text
http://127.0.0.1:5000
```

## Тэмдэглэл
- Бүх өгөгдөл `diary_data.json` файлд UTF-8-аар хадгалагдана.
- Монгол `ө`, `ү` үсгүүдийг зөв хадгалж, зөв харуулна.
- Календараас өдөр дараад тухайн өдрийн дэлгэрэнгүйг харж болно.


## v8
- Calendar date bug fixed (timezone-safe local dates)
- Added "Өнөөдөр" quick jump button in the calendar
- Today card now has a clearer sticker highlight
