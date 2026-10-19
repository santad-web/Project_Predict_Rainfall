# AGENTS.md

คู่มือสำหรับ AI Agent / นักพัฒนาที่ทำงานในโปรเจกต์นี้
(Songkhla Rainfall Forecasting System)

## 1. ภาพรวมโปรเจกต์
Web App (Pure HTML/CSS/JS) สำหรับพยากรณ์ปริมาณน้ำฝนจังหวัดสงขลา
- Stack: HTML + Vanilla CSS + Pure JavaScript (ไม่มี build step)
- Data: Open-Meteo API (ฟรี ไม่ต้องใช้ API Key)
- Charts: Chart.js ผ่าน CDN
- รายละเอียดเต็ม: ดู `spec.md`

## 2. โครงสร้างไฟล์ (File Structure)
```
project/
├── index.html   # โครงสร้าง UI, เรียก Chart.js CDN, เชื่อม style.css และ app.js
├── style.css    # สไตล์ธีมฟ้า/น้ำเงิน/เทา, responsive, การ์ด, ตาราง, dropdown
├── app.js       # ดึง API, คำนวณความเสี่ยง, วาดกราฟ, จัดการ event
└── spec.md      # เอกสาร requirement (แหล่งความจริงของโปรเจกต์)
```

## 3. วิธีรันและทดสอบ (Build / Run / Test)
โปรเจกต์นี้ **ไม่มี build step และไม่มี test framework**
### รัน
- เปิดตรง: ดับเบิลคลิก `index.html` (หรือคลิกขวา → Open with → Chrome)
- Local server (แนะนำ):
  - `python -m http.server 8000`
  - `npx http-server -p 8000`
- แล้วเปิด `http://localhost:8000`

### ทดสอบ
- **Manual:** เปิดหน้าเว็บ ตรวจ Dropdown อำเภอ/ช่วงเวลา, กราฟ, ตาราง, สถานะเตือนภัย
- **Network:** ตรวจสอบ Console / DevTools ว่า fetch Open-Meteo สำเร็จ
- **Responsive:** ตรวจ Layout บนหน้าแคบ (mobile) และกว้าง (desktop)

## 4. มาตรฐานการเขียนโค้ด (Coding Conventions)
- **JS:** Pure JS (ES6+, `fetch`, `async/await`) ไม่ใช้ framework
  - แยกฟังก์ชันให้ชัดตาม `spec.md` §8:
    `fetchWeather`, `getRiskLevel`, `renderSummary`, `renderChart`, `renderTable`
  - เก็บ state ปัจจุบัน (อำเภอ, ช่วงเวลา) ใน object เดียว
  - ใช้ `const`/`let` ไม่ใช้ `var`
- **CSS:**
  - ใช้ CSS variables (custom properties) สำหรับสีธีม
  - Mobile-first + media queries
  - จัดการสีสถานะเตือนภัยเป็น class: `.level-normal`, `.level-watch`, `.level-warning`
- **HTML:**
  - `index.html` เรียก Chart.js ผ่าน CDN
  - เชื่อม `style.css` (head) และ `app.js` (ท้าย body)
- **Naming:** ไฟล์/ตัวแปร `kebab-case` (CSS class) และ `camelCase` (JS)

## 5. กฎสำคัญที่ต้องถือ (Key Rules)
- **พิกัด:** ทุกอำเภอต้องมี Lat/Long — อ้างจาก `spec.md` §6.1
- **เกณฑ์ความเสี่ยง:** ค่าน้ำฝน (mm) → ระดับ ใช้ค่าคงที่กลางใน `app.js`
  - Normal: 0–10 / Watch: 10–25 / Warning: >25 (ตาม spec §7)
- **API Key:** ห้ามขอ/ใส่ API Key — Open-Meteo ฟรี
- **CORS:** ทำงานได้ทั้งเปิดไฟล์ตรงและ local server (Open-Meteo รองรับ CORS)
- **หน่วย:** น้ำฝนใช้ **มิลลิเมตร (mm)**, อุณหภูมิใช้ **°C**, เวลา **Asia/Bangkok**

## 6. จุดที่พบบ่อย / ข้อควรระวัง (Pitfalls)
- **เปลี่ยนช่วงเวลา:** เมื่อสลับตัวเลือก ต้อง `fetch` ใหม่และ update ทุกส่วน
  (การ์ด, กราฟ, ตาราง) ไม่ใช่แค่กราฟ
- **Chart.js destroy:** ก่อนวาดกราฟซ้ำให้ `destroy()` chart เดิมก่อน เพื่อไม่
  ให้กราฟซ้อนกัน
- **Timezone:** ใช้ `timezone=Asia%2FBangkok` ใน request เพื่อให้เวลาตรง
- **ค่า null จาก API:** `precipitation_probability` บางช่วงอาจเป็น `null`
  ต้อง handle (แสดง `-` หรือ 0)
- **Weather code:** แปลง `weather_code` เป็นไอคอน/ข้อความก่อนแสดง

## 7. Definition of Done (งานเสร็จ = ครบสิ่งนี้)
- [ ] เปิด `index.html` ได้ใน Chrome โดยไม่ error ใน Console
- [ ] Dropdown อำเภอและช่วงเวลาทำงาน เปลี่ยนแล้วดึงข้อมูลใหม่
- [ ] การ์ดสรุปผลแสดงค่าจริงจาก API
- [ ] กราฟ Rainfall Trend แสดงถูกต้องตามช่วงเวลา
- [ ] ตารางข้อมูลครบ ครอบคลุมเวลา/น้ำฝน/ความเสี่ยง
- [ ] สถานะเตือนภัยเปลี่ยนสีตามเกณฑ์ (เขียว/เหลือง/แดง)
- [ ] Responsive ผ่านทั้งหน้าแคบและกว้าง
- [ ] มี fallback กรณี API ไม่มีข้อมูล / ไม่มีเน็ต

## 8. แหล่งอ้างอิง (References)
- Requirement เต็ม: `spec.md`
- Open-Meteo API Docs: https://open-meteo.com/en/docs
- Chart.js Docs: https://www.chartjs.org/docs/latest/
