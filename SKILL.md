---
name: TikTok Affiliate Hunter Dashboard
description: Skill for finding best-selling products on TikTok Shop for affiliate marketing using Firecrawl API
---

# TikTok Affiliate Hunter Dashboard Skill

Dashboard สำหรับหาสินค้าขายดีบน TikTok Shop เพื่อทำ Affiliate Marketing

## Overview

ช่วยให้คุณ:
- 🔥 หาสินค้าที่กำลังเติบโตเร็ว (Trending Product Finder)
- 💰 วิเคราะห์ Commission และ Potential Earnings
- 📋 Copy Affiliate Links ได้ทันที
- 💡 ดู Content Ideas จาก Top Videos
- 🎯 หา Hidden Gems - สินค้าดีที่คู่แข่งน้อย
- ❤️ จัดการ Wishlist และ Track การ Promote

## Prerequisites

### Firecrawl API Key
1. ไปที่ [firecrawl.dev](https://firecrawl.dev)
2. สมัครบัญชี
3. Copy API key (format: `fc-xxxxxxxxxx`)

## Quick Start

```bash
cd c:\Users\User\Desktop\tiktok-analysis
npx serve . -p 3000
```

เปิด http://localhost:3000 แล้วใส่ API Key ใน Settings

## Features

### 1. Trending Product Finder
หาสินค้าที่เติบโตเร็วใน 7/30 วัน

**ใช้งาน:**
1. เลือก Tab "🔥 Trending"
2. ใส่ URL หรือ Keyword
3. Filter ตาม Growth %

### 2. Commission Rate Display
ดู Commission % และ Potential Earnings

**ดู:**
- 💰 badge แสดง commission
- Estimated earnings ต่อเดือน

### 3. Affiliate Link Quick Copy
จัดการ Links ได้ง่าย

**ใช้งาน:**
- 📋 Copy - copy link ทันที
- ❤️ Save - เก็บใน collection
- Export - ดาวน์โหลดพร้อม caption

### 4. Content Ideas Generator
ดู Videos ที่ขายดี + Hashtags

**ดู:**
- Top videos ของสินค้า
- Content type (unbox/review/tutorial)
- Trending hashtags

### 5. Low Competition Detector
หาสินค้าที่คู่แข่งน้อย

**Saturation Score:**
- 🟢 < 30 = Low Competition
- 🟡 30-60 = Medium
- 🔴 > 60 = High Competition

### 6. My Affiliate Dashboard
จัดการสินค้าที่สนใจ

**Tabs:**
- ❤️ Wishlist - สินค้าที่ save
- 📢 Promoted - สินค้าที่เคย promote
- 📝 Notes - บันทึกส่วนตัว

## Data Schema

```javascript
{
  product_name: string,
  price: number,
  sold_count: number,
  growth_rate: number,      // % growth
  commission_rate: number,  // %
  saturation_score: number, // 1-100
  affiliate_link: string,
  top_videos: [],
  hashtags: []
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API Key Invalid | ตรวจสอบ key, ไม่มี space |
| Scrape Failed | รอ 1-2 นาที แล้วลองใหม่ |
| No Data | ตรวจสอบ URL ถูกต้อง |

## Version
- v1.0.0 - 2026-01-21 - Initial release with 6 core features
