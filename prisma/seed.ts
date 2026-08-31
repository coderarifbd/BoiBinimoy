import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting BoiBinimoy database seed...");

  // Clean old records
  await prisma.chatMessage.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.withdrawalRequest.deleteMany();
  await prisma.referralRecord.deleteMany();
  await prisma.bookRequest.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("123456", 10);
  const adminHashedPassword = await bcrypt.hash("admin123456", 10);

  // 1. Super Admin User
  const admin = await prisma.user.create({
    data: {
      name: "BoiBinimoy Super Admin",
      email: "admin@boibinimoy.com",
      password: adminHashedPassword,
      role: "SUPER_ADMIN",
      referralCode: "ADMINVIP",
      points: 2500,
      phone: "01700000000",
      locationName: "ঢাকা বিশ্ববিদ্যালয় (DU)",
      latitude: 23.734,
      longitude: 90.392,
    },
  });

  // 2. Regular Users
  const userTanvir = await prisma.user.create({
    data: {
      name: "তানভীর আহমেদ (DU)",
      email: "tanvir@gmail.com",
      password: hashedPassword,
      role: "USER",
      referralCode: "TANVIR100",
      points: 1000, // Ready to withdraw
      phone: "01711223344",
      locationName: "কার্জন হল, ঢাবি",
      latitude: 23.727,
      longitude: 90.401,
    },
  });

  const userSakib = await prisma.user.create({
    data: {
      name: "সাকিব হাসান (BUET)",
      email: "sakib@gmail.com",
      password: hashedPassword,
      role: "USER",
      referralCode: "SAKIB200",
      points: 600,
      phone: "01811223344",
      locationName: "বুয়েট ক্যাম্পাস",
      latitude: 23.726,
      longitude: 90.398,
      referredById: userTanvir.id,
    },
  });

  const userFarhana = await prisma.user.create({
    data: {
      name: "ফারহানা ইয়াসমিন (DMC)",
      email: "farhana@gmail.com",
      password: hashedPassword,
      role: "USER",
      referralCode: "FARHANA300",
      points: 300,
      phone: "01911223344",
      locationName: "ঢাকা মেডিকেল কলেজ",
      latitude: 23.725,
      longitude: 90.397,
      referredById: userTanvir.id,
    },
  });

  const userRahim = await prisma.user.create({
    data: {
      name: "রহিম চৌধুরী (Mirpur)",
      email: "rahim@gmail.com",
      password: hashedPassword,
      role: "USER",
      referralCode: "RAHIM400",
      points: 200,
      phone: "01611223344",
      locationName: "মিরপুর ১০",
      latitude: 23.807,
      longitude: 90.368,
    },
  });

  const userNabila = await prisma.user.create({
    data: {
      name: "নাবিলা তাবাসসুম (Dhanmondi)",
      email: "nabila@gmail.com",
      password: hashedPassword,
      role: "USER",
      referralCode: "NABILA500",
      points: 100,
      phone: "01511223344",
      locationName: "ধানমন্ডি ২৭",
      latitude: 23.753,
      longitude: 90.375,
    },
  });

  // 3. Referral Log for Tanvir (He invited multiple real users)
  await prisma.referralRecord.createMany({
    data: [
      { referrerId: userTanvir.id, referredUserId: userSakib.id, hasListedBook: true, pointsAwarded: 100 },
      { referrerId: userTanvir.id, referredUserId: userFarhana.id, hasListedBook: true, pointsAwarded: 100 },
    ],
  });

  // 4. Books Listings (Sell, Swap, Giveaway)
  const book1 = await prisma.book.create({
    data: {
      title: "Fundamentals of Electric Circuits (Sadiku 6th Edition)",
      author: "Charles Alexander, Matthew Sadiku",
      category: "ACADEMIC_ENG",
      condition: "LIKE_NEW",
      dealType: "SELL",
      price: 320,
      images: [
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
      ],
      status: "AVAILABLE",
      latitude: 23.726,
      longitude: 90.398,
      approxLocation: "বুয়েট ক্যাম্পাস (Eee Dept)",
      userId: userSakib.id,
    },
  });

  const book2 = await prisma.book.create({
    data: {
      title: "Guyton and Hall Textbook of Medical Physiology",
      author: "John E. Hall",
      category: "ACADEMIC_MED",
      condition: "GOOD",
      dealType: "SELL",
      price: 550,
      images: [
        "https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=600&auto=format&fit=crop&q=80",
      ],
      status: "AVAILABLE",
      latitude: 23.725,
      longitude: 90.397,
      approxLocation: "ঢাকা মেডিকেল কলেজ সংলগ্ন",
      userId: userFarhana.id,
    },
  });

  const book3 = await prisma.book.create({
    data: {
      title: "প্রফেসরস বিসিএস প্রিলিমিনারি ডাইজেস্ট (৪৬তম বিসিএস)",
      author: "প্রফেসরস প্রকাশন",
      category: "BCS_JOB",
      condition: "NEW",
      dealType: "SWAP",
      price: 0,
      images: [
        "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&auto=format&fit=crop&q=80",
      ],
      status: "AVAILABLE",
      latitude: 23.734,
      longitude: 90.392,
      approxLocation: "ঢাবি টিএসসি চত্বর",
      userId: userTanvir.id,
    },
  });

  const book4 = await prisma.book.create({
    data: {
      title: "দেয়াল (Deyal)",
      author: "হুমায়ূন আহমেদ",
      category: "FICTION",
      condition: "LIKE_NEW",
      dealType: "GIVEAWAY",
      price: 0,
      images: [
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
      ],
      status: "AVAILABLE",
      latitude: 23.753,
      longitude: 90.375,
      approxLocation: "ধানমন্ডি রবীন্দ্র সরোবর",
      userId: userNabila.id,
    },
  });

  const book5 = await prisma.book.create({
    data: {
      title: "উচ্চ মাধ্যমিক পদার্থবিজ্ঞান ১ম ও ২য় পত্র (শাহজাহান তপন)",
      author: "ড. শাহজাহান তপন",
      category: "ACADEMIC_COLLEGE",
      condition: "ACCEPTABLE",
      dealType: "SELL",
      price: 180,
      images: [
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80",
      ],
      status: "AVAILABLE",
      latitude: 23.807,
      longitude: 90.368,
      approxLocation: "মিরপুর ১০ মেট্রো স্টেশন গেট",
      userId: userRahim.id,
    },
  });

  // 5. Withdrawal Requests for Admin Payout Manager
  await prisma.withdrawalRequest.create({
    data: {
      userId: userTanvir.id,
      pointsDeducted: 1000,
      amount: 50,
      method: "BKASH",
      accountNumber: "01711223344",
      status: "PENDING",
      createdAt: new Date(),
    },
  });

  await prisma.withdrawalRequest.create({
    data: {
      userId: userRahim.id,
      pointsDeducted: 1000,
      amount: 50,
      method: "NAGAD",
      accountNumber: "01611223344",
      status: "APPROVED",
      adminNote: "TrxID: 9AK8812L0 - Successfully sent via Nagad",
    },
  });

  // 6. "বইয়ের খোঁজ চাই" (Book Request)
  await prisma.bookRequest.create({
    data: {
      title: "Discrete Mathematics and Its Applications (Rosen 8th Edition)",
      author: "Kenneth H. Rosen",
      category: "ACADEMIC_ENG",
      description: "সিএসই ৩য় সেমিস্টারের জন্য জরুরি দরকার। কারও কাছে থাকলে নীলক্ষেত বা ক্যাম্পাসে মিট করতে পারব।",
      approxLocation: "কার্জন হল / টিএসসি, ঢাকা বিশ্ববিদ্যালয়",
      latitude: 23.734,
      longitude: 90.392,
      userId: userTanvir.id,
      status: "OPEN",
    },
  });

  await prisma.bookRequest.create({
    data: {
      title: "অসমাপ্ত আত্মজীবনী",
      author: "শেখ মুজিবুর রহমান",
      category: "NON_FICTION",
      description: "পড়ার জন্য কারো কাছ থেকে দুই সপ্তাহের জন্য বড়ো/সোয়াপ করতে চাই।",
      approxLocation: "ধানমন্ডি ২৭",
      latitude: 23.753,
      longitude: 90.375,
      userId: userNabila.id,
      status: "OPEN",
    },
  });

  // 7. Active Chat Room with "Make an Offer" & Safe Meetup
  const chatRoom = await prisma.chatRoom.create({
    data: {
      bookId: book1.id,
      buyerId: userTanvir.id,
      sellerId: userSakib.id,
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        roomId: chatRoom.id,
        senderId: userTanvir.id,
        content: "ভাইয়া, সাদিকুর বইটা কি এখনও Available আছে? পাতাগুলো কেমন কন্ডিশনে আছে?",
        createdAt: new Date(Date.now() - 3600000 * 3),
      },
      {
        roomId: chatRoom.id,
        senderId: userSakib.id,
        content: "হ্যাঁ ভাই একদম ফ্রেশ কন্ডিশন। কোনো দাগ বা ছেঁড়া নেই।",
        createdAt: new Date(Date.now() - 3600000 * 2),
      },
      {
        roomId: chatRoom.id,
        senderId: userTanvir.id,
        content: "আমি ২৫০ টাকায় নিতে চাচ্ছি। আপনি কি রাজি আছেন?",
        isOffer: true,
        offerAmount: 250,
        offerStatus: "ACCEPTED",
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        roomId: chatRoom.id,
        senderId: userSakib.id,
        content: "ঠিক আছে ভাই, ২৫০ টাকায় ডিল ডান!",
        meetupSpot: "বুয়েট ক্যাফেটেরিয়া",
        createdAt: new Date(Date.now() - 1800000),
      },
    ],
  });

  console.log("✅ BoiBinimoy database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
