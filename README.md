# BoiBinimoy (বইবিনিময়) 📚✨

> **বাংলাদেশের প্রথম হাইপার-লোকাল বই শেয়ারিং, বিক্রয় ও সোয়াপিং প্ল্যাটফর্ম**

---

## 🚀 পরিচিতি (Overview)
**BoiBinimoy** হলো একটি হাইপার-লোকাল কমিউনিটি প্ল্যাটফর্ম যা সাধারণ পাঠক ও শিক্ষার্থীদের মধ্যে পুরাতন বা অতিরিক্ত বই হাতবদল, বিক্রয় বা সোয়াপিং সহজ করে তোলে। কোনো মধ্যস্বত্বভোগী বা অতিরিক্ত কমিশন ছাড়াই ব্যবহারকারীরা সরাসরি ইন-অ্যাপ মেসেঞ্জারে কথা বলে ক্যাম্পাস বা পাবলিক স্পটে বই বিনিময় করতে পারেন।

---

## 🌟 মূল ফিচারসমূহ (Core Features)

1. **📍 হাইপার-লোকাল ম্যাপ ও স্মার্ট জিপিএস (Hyper-local Discovery):**
   - লাইভ জিপিএস স্বয়ংক্রিয়ভাবে ব্যবহারকারীর শহর/এলাকা শনাক্ত করে নিকটবর্তী বইয়ের সঠিক দূরত্ব (কিমি) হিসাব করে।
   - ওপেনস্ট্রিটম্যাপ ও লিফলেট ইন্টিগ্রেশনের মাধ্যমে ইন্টারঅ্যাক্টিভ পিন ভিউ ও রেডিয়াস ফিল্টার (১-৫০ কিমি / সারাদেশ)।

2. **💬 ফেসবুক ডেক্সটপ-স্টাইল মেসেঞ্জার চ্যাট ও অফার:**
   - রিয়েল-টাইম ইনস্ট্যান্ট মেসেজিং (Optimistic Instant Updates + Live Sync)।
   - **Make an Offer:** চ্যাটবক্স থেকেই দাম প্রস্তাব (Negotiation) এবং Accept/Decline।
   - **Safe Meetup Spot:** পরিচিত ক্যাম্পাস/মেট্রো স্পট নির্বাচন করে হাতবদল।
   - পিন করা বই রেফারেন্স স্ট্রিপ ও ছবি শেয়ারিং।

3. **📸 ৩-স্টেপে ফাস্ট বই লিস্টিং ও অটো WebP কম্প্রেশন:**
   - ক্লায়েন্ট সাইডেই ছবি কম্প্রেশন (<500KB WebP) হয়ে ক্লাউডিনারি ও ডাটাবেজে সংরক্ষণ।
   - Sell, Swap বা Giveaway ডিল টাইপ সিলেক্ট করে ১-ট্যাপে প্রকাশ।

4. **🎁 ১০ বন্ধুতে ৫০৳ গ্রোথ ও রেফারেল ইঞ্জিন:**
   - বন্ধুদের ইনভাইট করে প্রতি রেফারেলে ১০০ পয়েন্ট (১০ বন্ধু = ১০০০ পয়েন্ট = ৫০৳)।
   - অ্যান্টি-ফ্রড ভেরিফিকেশন (বন্ধু অন্তত ১টি বই পোস্ট করলেই রিওয়ার্ড কাউন্ট)।
   - বিকাশ, নগদ ও মোবাইল রিচার্জ উইথড্র রিকোয়েস্ট সিস্টেম।

5. **🛡️ সুপার অ্যাডমিন ম্যানেজমেন্ট ড্যাশবোর্ড (`/admin`):**
   - পেআউট রিকোয়েস্ট ভেরিফিকেশন, অনুমোদন ও ট্রানজেকশন আইডি নোট।
   - বই মডারেশন (১-ক্লিক ডিলিট/ব্যান) ও রিয়েল-টাইম অ্যানালিটিক্স।

---

## 🛠️ টেক স্ট্যাক (Tech Stack)
- **Framework:** Next.js 16 (App Router, TypeScript, Turbopack)
- **Styling:** Tailwind CSS v4, Lucide Icons
- **Database & ORM:** Neon PostgreSQL, Prisma ORM
- **Maps & Geolocation:** Leaflet, OpenStreetMap, Haversine Engine
- **Image Processing & Storage:** Canvas WebP Compressor, Cloudinary
- **Realtime:** Fast Polling + Pusher Integration

---

## 📦 লোকাল সেটআপ গাইড (Getting Started)

### ১. রিপোজিটরি ক্লোন করুন
```bash
git clone https://github.com/coderarifbd/BoiBinimoy.git
cd BoiBinimoy
```

### ২. ডিপেন্ডেন্সি ইনস্টল করুন
```bash
npm install
```

### ৩. এনভায়রনমেন্ট ভেরিয়েবল সেটআপ (`.env`)
```env
DATABASE_URL="your-neon-postgresql-url"
JWT_SECRET="your-jwt-secret"
CLOUDINARY_URL="cloudinary://..."
ADMIN_EMAILS="admin@boibinimoy.com"
```

### ৪. ডাটাবেজ পুশ ও সিড করুন
```bash
npx prisma db push
npx ts-node prisma/seed.ts
```

### ৫. ডেভেলপমেন্ট সার্ভার চালু করুন
```bash
npm run dev
```
ব্রাউজারে ওপেন করুন: `http://localhost:3000`

---

## 📄 লাইসেন্স (License)
MIT © [BoiBinimoy](https://github.com/coderarifbd/BoiBinimoy)
