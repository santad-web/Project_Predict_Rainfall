# Spec: ระบบพยากรณ์ปริมาณน้ำฝนจังหวัดสงขลา
**Songkhla Rainfall Forecasting System**

## 1. ภาพรวม (Overview)

ระบบ Web Application สำหรับพยากรณ์และติดตามปริมาณน้ำฝนในจังหวัดสงขลา
โดยดึงข้อมูลสภาพอากาศและปริมาณน้ำฝนจริงจาก Open-Meteo API (ฟรี ไม่ต้องใช้ API Key)
แล้วแสดงผลผ่าน Dashboard ธีมฟ้า/น้ำเงิน/เทา พร้อมกราฟแนวโน้ม (Chart.js)
และระบบแจ้งเตือนภัยน้ำท่วม/ฝนตกหนักตามระดับความเสี่ยง

- **Stack:** HTML + CSS (Vanilla) + JavaScript (Pure JS)
- **Data Source:** Open-Meteo API (https://api.open-meteo.com/v1/forecast)
- **Charts:** Chart.js (โหลดผ่าน CDN)
- **จุดประสงค์:** เปิดใช้งานผ่าน Browser (เช่น Google Chrome) ได้ทันที

## 2. โครงสร้างไฟล์ (File Structure)

| ไฟล์ | หน้าที่ |
|------|---------|
| `index.html` | โครงสร้าง HTML, เรียกใช้ Chart.js CDN, เชื่อมต่อ style.css และ app.js |
| `style.css` | สไตล์ UI ธีมฟ้า/น้ำเงิน/เทา, Responsive, การ์ด, ตาราง, ตัว dropdown |
| `app.js` | ดึงข้อมูล API, คำนวณระดับความเสี่ยง, วาดกราฟ, จัดการเหตุการณ์ UI |

## 3. เทคโนโลยีและไลบรารี (Dependencies)

- **Open-Meteo API** — ฟรี ไม่ต้องใช้ API Key
  - Endpoint: `https://api.open-meteo.com/v1/forecast`
  - พารามิเตอร์หลัก: `latitude`, `longitude`, `hourly=precipitation`,
    `forecast_days`, `timezone=Asia%2FBangkok`
- **Chart.js** — วาดกราฟแท่ง/เส้นสำหรับแนวโน้มปริมาณน้ำฝน (CDN)
  - https://cdn.jsdelivr.net/npm/chart.js

## 4. ข้อกำหนดโครงสร้างและดีไซน์ (UI/UX Requirements)

### 4.1 ธีมและสี
- โทนหลัก: ฟ้า / น้ำเงิน / เทา (Blue/Gray palette) — ธีม Modern Dashboard / Weather App
- พื้นหลัง: สีเข้มโทนน้ำเงินเทา หรือ gradient ไล่ระดับ
- สีสถานะการเตือนภัย (ตามระดับปริมาณน้ำฝน, หน่วย: มิลลิเมตร):
  - **Normal (ปกติ)** — เขียว  : ปริมาณน้ำฝน 0–10 mm
  - **Watch (เฝ้าระวัง)** — เหลือง/ส้ม : 10–25 mm
  - **Warning (เตือนภัย)** — แดง : มากกว่า 25 mm
  - (ปรับค่าเกณฑ์ได้ตามความเหมาะสม — ระบุค่าที่เลือกไว้ใน Implementation Notes)

### 4.2 Responsive Design
- รองรับทั้ง Desktop และ Mobile (mobile-first)
- ใช้ CSS Grid / Flexbox + media queries
- Layout บน Desktop: การ์ดเรียงแบบ 2–4 คอลัมน์ / บน Mobile: เรียง 1 คอลัมน์

### 4.3 ส่วนประกอบหน้าจอ (Layout Sections)
1. **Header** — ชื่อระบบ, ไอคอนสภาพอากาศ, เวลาปัจจุบัน/เวลาอัปเดตล่าสุด
2. **Control Bar** — Dropdown เลือกอำเภอ + Dropdown เลือกระยะเวลาพยากรณ์
3. **Summary Cards** — การ์ดสรุปผล: อุณหภูมิปัจจุบัน, ปริมาณน้ำฝนรวม/สูงสุด,
   ความน่าจะเป็นฝน, สถานะการเตือนภัย (แสดงสีตามระดับ)
4. **Trend Chart** — กราฟแนวโน้มปริมาณน้ำฝน (Rainfall Trend) ด้วย Chart.js
5. **Data Table** — ตารางรายชั่วโมง/รายวัน: เวลา, อุณหภูมิ, น้ำฝน (mm), ความน่าจะเป็น, ระดับความเสี่ยง

## 5. ฟังก์ชันการทำงาน (Features)

### 5.1 เลือกอำเภอ (Dropdown)
- มี Dropdown เลือกอำเภอในจังหวัดสงขลา เช่น:
  เมืองสงขลา, หาดใหญ่, สะเดา, ระโนด, เทพา,
  นาหมื่น, ควนเนียง, จะนะ, กงไกร
- แต่ละอำเภอต้องมีพิกัด Lat/Long
  (ค่าเริ่มต้นจังหวัด: Lat 7.1988, Long 100.5951)

### 5.2 เลือกระยะเวลาพยากรณ์ (Dropdown)
- ตัวเลือก: รายชั่วโมง (Today) / ล่วงหน้า 3 วัน / ล่วงหน้า 7 วัน
- เมื่อเปลี่ยนตัวเลือก ให้ดึงข้อมูลใหม่และอัปเดตกราฟ + ตาราง

### 5.3 ดึงข้อมูลสภาพอากาศ
- เรียก Open-Meteo API ด้วย `fetch()` พร้อมพิกัดของอำเภอที่เลือก
- ฟิลด์ที่จำเป็น: `precipitation`, `precipitation_probability`,
  `temperature_2m`, `relative_humidity_2m`, `weather_code`, `wind_speed_10m`
- จัดการกรณีผิดพลาด: ไม่มีเน็ต / API error — แสดงข้อความเตือน

### 5.4 คำนวณระดับความเสี่ยงและแจ้งเตือนภัย
- วิเคราะห์ปริมาณน้ำฝน (mm) เทียบกับเกณฑ์
- แสดงสถานะ: Normal / Watch / Warning พร้อมสีเตือน
- อัปเดตสถานะรวม (summary) ตามช่วงเวลาที่เลือก

### 5.5 แสดงผลกราฟและตาราง
- กราฟ Rainfall Trend (Chart.js) — กราฟแท่ง/เส้น
- ตารางรายชั่วโมง/รายวัน ครอบคลุมเวลา, น้ำฝน, ระดับความเสี่ยง

## 6. โมเดลข้อมูลและ API (Data Model & API)

### 6.1 พิกัดอำเภอ (ตัวอย่าง)
| อำเภอ | Latitude | Longitude |
|--------|----------|-----------|
| เมืองสงขลา | 7.1988 | 100.5951 |
| หาดใหญ่ | 7.0086 | 100.4349 |
| สะเดา | 6.7333 | 100.3956 |
| ระโนด | 7.0458 | 100.5419 |
| เทพา | 6.7256 | 100.5500 |
| กงไกร | 7.1486 | 100.3456 |

(ค่าพิกัดเป็นค่าโดยประมาณ — สามารถปรับค่าจริงได้)

### 6.2 ตัวอย่างคำขอ API (Open-Meteo)
```
GET https://api.open-meteo.com/v1/forecast
    ?latitude=7.1988
    &longitude=100.5951
    &hourly=precipitation,precipitation_probability,temperature_2m,
            relative_humidity_2m,weather_code,wind_speed_10m
    &forecast_days=7
    &timezone=Asia%2FBangkok
```

### 6.3 ฟิลด์คำตอบ (Response Fields)
- `hourly.time[]` — เวลา (ISO 8601)
- `hourly.precipitation[]` — ปริมาณน้ำฝน (mm)
- `hourly.precipitation_probability[]` — ความน่าจะเป็นฝน (%)
- `hourly.temperature_2m[]` — อุณหภูมิ (°C)
- `current` — สภาพอากาศปัจจุบัน

## 7. เกณฑ์ระดับความเสี่ยง (Risk Thresholds)

ปริมาณน้ำฝนรายชั่วโมง/รายวัน (mm) → ระดับ:

| ระดับ | เกณฑ์ (mm) | สี | ข้อความ |
|-------|-----------|-----|---------|
| Normal | 0 – 10 | เขียว | ปกติ ฝนตกเล็กน้อย |
| Watch  | 10 – 25 | เหลือง/ส้ม | เฝ้าระวังฝนตกปานกลาง-มาก |
| Warning| > 25 | แดง | เตือนภัย ฝนตกหนัก เสี่ยงน้ำท่วม |

> เกณฑ์นี้ใช้สำหรับ **ค่าต่อช่วงเวลา** (รายชั่วโมง หรือรายวัน) ตามตัวเลือกที่ผู้ใช้เลือก
> สามารถปรับค่าได้โดยแก้ค่าคงที่ใน `app.js`

## 8. หมายเหตุการนำไปใช้ (Implementation Notes)

- **Structure:** แยก 3 ไฟล์ (index.html, style.css, app.js) เพื่ออ่านง่าย
- **Chart.js:** โหลดผ่าน CDN ใน `index.html`
- **CSS:** ใช้ Vanilla CSS หรือ Tailwind (spec แนะนำ Vanilla เพื่อควบคุมธีมตรง)
- **JS:** แยกฟังก์ชันให้ชัด:
  - `fetchWeather(lat, lon, days)` — เรียก API
  - `getRiskLevel(mm)` — คำนวณระดับความเสี่ยง
  - `renderSummary(data)` — อัปเดตการ์ดสรุปผล
  - `renderChart(data)` — วาด/อัปเดตกราฟ
  - `renderTable(data)` — สร้างตารางข้อมูล
- **State:** เก็บอำเภอและช่วงเวลาปัจจุบันใน object state

## 9. การจัดการข้อผิดพลาด (Error Handling)

- ไม่มีเครือข่าย / API timeout → แสดง banner เตือน + ข้อมูลล่าสุด (ถ้ามี)
- API response ไม่มีข้อมูล → แสดงข้อความให้ตรวจสอบ
- พิกัดไม่ถูกต้อง → ใช้ค่าเริ่มต้นจังหวัดสงขลา
- โหลด Chart.js ไม่สำเร็จ → แสดง fallback ข้อความ

## 10. วิธีรันใช้งาน (How to Run)

### วิธีที่ 1: เปิดด้วย Browser โดยตรง
1. วางไฟล์ `index.html`, `style.css`, `app.js` ไว้ในโฟลเดอร์เดียวกัน
2. คลิกขวาที่ `index.html` → **Open with** → เลือก Google Chrome
3. ระบบจะดึงข้อมูลจาก Open-Meteo API ผ่านอินเทอร์เน็ตทันที

### วิธีที่ 2: ใช้ Local Server (แนะนำ เพื่อเลี่ยง CORS)
```
# จากโฟลเดอร์โปรเจกต์ รันคำสั่ง (เลือกอย่างใดอย่างหนึ่ง)
python -m http.server 8000
# หรือ
npx http-server -p 8000
```
4. เปิดเบราว์เซอร์ที่ `http://localhost:8000`

> หมายเหตุ: Open-Meteo API รองรับ CORS ได้ทั้งวิธีเปิดไฟล์ตรงและ local server
> แต่แนะนำ local server เพื่อความเสถียรในการดึงข้อมูล
