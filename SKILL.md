---
name: songkhla-rainfall-forecast
description: สร้าง/พัฒนาเว็บ "ระบบพยากรณ์ปริมาณน้ำฝนจังหวัดสงขลา" (HTML+CSS+JS, Open-Meteo, Chart.js) — ใช้เมื่อต้องสร้างหรือแก้ Weather/Rainfall Dashboard
---

# Skill: Songkhla Rainfall Forecasting System

Skill นี้ใช้เมื่อต้อง **สร้าง, พัฒนา หรือแก้ไข** เว็บแอป
"ระบบพยากรณ์ปริมาณน้ำฝนจังหวัดสงขลา"
(Weather/Rainfall Forecasting Dashboard)

## When to Use
ใช้ Skill นี้เมื่อ:
- ถูกขอให้สร้างเว็บพยากรณ์ฝน/สภาพอากาศสำหรับจังหวัดสงขลา
- ต้องทำ Weather Dashboard ด้วย HTML+CSS+JS + Open-Meteo + Chart.js
- ต้องเพิ่ม/แก้: Dropdown อำเภอ, เลือกช่วงเวลา, กราฟ, ตาราง, สถานะเตือนภัย
- ต้องคำนวณระดับความเสี่ยง (Normal/Watch/Warning) จากปริมาณน้ำฝน

## When NOT to Use
- โปรเจกต์ที่ใช้ framework อื่น (React/Vue/Angular) → ใช้แนวทางของ framework นั้น
- ต้องการ API อื่นที่นอกเหนือจาก Open-Meteo

## สิ่งที่ต้องมีก่อนเริ่ม (Preconditions)
- มี `spec.md` และ `AGENTS.md` ในโปรเจกต์ (ถ้าไม่มี ให้สร้างก่อน)
- มีไฟล์หลัก 3 ตัว: `index.html`, `style.css`, `app.js`
- เปิดใช้งานผ่าน Browser (แนะนำ local server)

## Core Workflow (ขั้นตอนการสร้าง)

### 1. สร้างโครงสร้างไฟล์
สร้าง 3 ไฟล์ในโฟลเดอร์เดียวกัน:
```
index.html  →  เรียก Chart.js CDN + เชื่อม style.css / app.js
style.css   →  ธีมฟ้า/น้ำเงิน/เทา, responsive
app.js      →  logic ทั้งหมด
```

### 2. เขียน `index.html`
- Header + Control Bar (2 ตัว dropdown)
- Summary Cards (4 ใบ: อุณหภูมิ, น้ำฝน, ความน่าจะเป็น, สถานะ)
- Container สำหรับ Chart.js
- Container สำหรับ Data Table
- `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`
- `<script src="app.js"></script>` (ท้าย body)

### 3. เขียน `style.css`
- กำหนด CSS variables สำหรับสีธีม + สี 3 ระดับเตือนภัย
- Grid/Flexbox layout, mobile-first + media queries
- Class สถานะ: `.level-normal` (เขียว), `.level-watch` (เหลือง),
  `.level-warning` (แดง)

### 4. เขียน `app.js`
- object state (อำเภอปัจจุบัน, ช่วงเวลาปัจจุบัน)
- `fetchWeather(lat, lon, days)` → เรียก Open-Meteo
- `getRiskLevel(mm)` → คืนสถานะตามเกณฑ์
- `renderSummary(data)`, `renderChart(data)`, `renderTable(data)`
- listener บน 2 dropdown → fetch ใหม่ + update ทุกส่วน

## API Reference (Open-Meteo)
- Endpoint: `https://api.open-meteo.com/v1/forecast`
- ไม่ต้องใช้ API Key
- ตัวอย่าง:
```
GET /v1/forecast?latitude=7.1988&longitude=100.5951
    &hourly=precipitation,precipitation_probability,temperature_2m,
            relative_humidity_2m,weather_code,wind_speed_10m
    &forecast_days=7&timezone=Asia%2FBangkok
```
- ค่าที่จำเป็น: `hourly.time[]`, `hourly.precipitation[]`,
  `hourly.temperature_2m[]`, `current`

## พิกัดอำเภอ (ใช้เมื่อสร้าง dropdown)
| อำเภอ | Lat | Long |
|--------|-----|------|
| เมืองสงขลา | 7.1988 | 100.5951 |
| หาดใหญ่ | 7.0086 | 100.4349 |
| สะเดา | 6.7333 | 100.3956 |
| ระโนด | 7.0458 | 100.5419 |
| เทพา | 6.7256 | 100.5500 |

## เกณฑ์ระดับความเสี่ยง (mm)
- Normal: 0–10 (เขียว)
- Watch: 10–25 (เหลือง/ส้ม)
- Warning: > 25 (แดง)
> เก็บค่าเกณฑ์เป็นค่าคงที่กลางใน `app.js` เพื่อให้ปรับง่าย

## Verification (ตรวจงานก่อนส่ง)
- [ ] เปิดใน Chrome โดยไม่มี error ใน Console
- [ ] เปลี่ยน dropdown แล้วกราฟ/ตาราง/การ์ดอัปเดตทั้งหมด
- [ ] กราฟไม่ซ้อนกัน (ต้อง destroy chart เดิมก่อนวาดใหม่)
- [ ] สีสถานะเตือนภัยถูกต้องตามปริมาณน้ำฝน
- [ ] Responsive บนหน้าแคบและกว้าง
- [ ] Fallback เมื่อ API ไม่มีข้อมูล/ไม่มีเน็ต
