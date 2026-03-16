import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users, studios } from "../src/db/schema/users";
import bcryptjs from "bcryptjs";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const DEMO_PASSWORD = "Demo1234!";

const demoUsers = [
  // 1 Admin
  { name: "Admin", surname: "MoveLeague", username: "admin_ml", email: "admin@moveleague.com", role: "admin" as const, city: "İstanbul", country: "Türkiye" },
  // 2 Dancers
  { name: "Ayşe", surname: "Yılmaz", username: "ayse_dancer", email: "ayse@moveleague.com", role: "dancer" as const, city: "İstanbul", country: "Türkiye", danceStyle: "Breaking" },
  { name: "Carlos", surname: "Rivera", username: "carlos_dancer", email: "carlos@moveleague.com", role: "dancer" as const, city: "Madrid", country: "İspanya", danceStyle: "Popping" },
  // 2 Judges
  { name: "Mehmet", surname: "Kaya", username: "mehmet_judge", email: "mehmet@moveleague.com", role: "judge" as const, city: "Ankara", country: "Türkiye" },
  { name: "Lisa", surname: "Chen", username: "lisa_judge", email: "lisa@moveleague.com", role: "judge" as const, city: "Tokyo", country: "Japonya" },
  // 4 Studios
  { name: "Studio", surname: "Flamingo", username: "studio_flamingo", email: "flamingo@moveleague.com", role: "studio" as const, city: "İstanbul", country: "Türkiye" },
  { name: "Studio", surname: "Groove", username: "studio_groove", email: "groove@moveleague.com", role: "studio" as const, city: "Ankara", country: "Türkiye" },
  { name: "Studio", surname: "Pulse", username: "studio_pulse", email: "pulse@moveleague.com", role: "studio" as const, city: "İzmir", country: "Türkiye" },
  { name: "Studio", surname: "Vibe", username: "studio_vibe", email: "vibe@moveleague.com", role: "studio" as const, city: "Antalya", country: "Türkiye" },
  // 1 Coach
  { name: "Deniz", surname: "Akın", username: "deniz_coach", email: "deniz@moveleague.com", role: "coach" as const, city: "İstanbul", country: "Türkiye" },
];

const demoStudios = [
  { ownerUsername: "studio_flamingo", name: "Flamingo Dance Studio", description: "İstanbul'un en enerjik dans stüdyosu", address: "Kadıköy, Moda Cad. No:12", city: "İstanbul", country: "Türkiye", phone: "+905551234567" },
  { ownerUsername: "studio_groove", name: "Groove Academy", description: "Ankara'nın ilk street dance akademisi", address: "Çankaya, Tunalı Hilmi Cad. No:45", city: "Ankara", country: "Türkiye", phone: "+905559876543" },
  { ownerUsername: "studio_pulse", name: "Pulse Dance Center", description: "İzmir'de dans tutkunları için", address: "Alsancak, Kıbrıs Şehitleri Cad. No:78", city: "İzmir", country: "Türkiye", phone: "+905554567890" },
  { ownerUsername: "studio_vibe", name: "Vibe Studio", description: "Antalya'nın dans merkezi", address: "Lara, Güzeloba Mah. No:33", city: "Antalya", country: "Türkiye", phone: "+905557654321" },
];

async function seed() {
  console.log("🌱 Demo hesaplar oluşturuluyor...\n");

  const passwordHash = await bcryptjs.hash(DEMO_PASSWORD, 12);

  // Insert users
  const insertedUsers: Record<string, string> = {};

  for (const user of demoUsers) {
    try {
      const result = await db
        .insert(users)
        .values({
          name: user.name,
          surname: user.surname,
          username: user.username,
          email: user.email,
          passwordHash,
          role: user.role,
          city: user.city,
          country: user.country,
          danceStyle: (user as any).danceStyle || null,
          emailVerified: true,
          isActive: true,
        })
        .returning({ id: users.id, username: users.username, role: users.role });

      insertedUsers[result[0].username] = result[0].id;
      console.log(`  ✅ ${result[0].role.padEnd(7)} | ${user.email} | ${user.username}`);
    } catch (err: any) {
      if (err.message?.includes("duplicate") || err.message?.includes("unique")) {
        console.log(`  ⏭️  Zaten var: ${user.email}`);
      } else {
        console.error(`  ❌ Hata (${user.username}):`, err.message);
      }
    }
  }

  // Insert studios
  console.log("\n🏢 Stüdyolar oluşturuluyor...\n");

  for (const studio of demoStudios) {
    const ownerId = insertedUsers[studio.ownerUsername];
    if (!ownerId) {
      console.log(`  ⏭️  Stüdyo sahibi bulunamadı: ${studio.ownerUsername}`);
      continue;
    }
    try {
      await db.insert(studios).values({
        ownerId,
        name: studio.name,
        description: studio.description,
        address: studio.address,
        city: studio.city,
        country: studio.country,
        phone: studio.phone,
        isVerified: true,
        isAvailable: true,
      });
      console.log(`  ✅ ${studio.name} (${studio.city})`);
    } catch (err: any) {
      if (err.message?.includes("duplicate") || err.message?.includes("unique")) {
        console.log(`  ⏭️  Zaten var: ${studio.name}`);
      } else {
        console.error(`  ❌ Hata (${studio.name}):`, err.message);
      }
    }
  }

  console.log("\n✨ Seed tamamlandı!");
  console.log(`\n📋 Tüm demo hesapların şifresi: ${DEMO_PASSWORD}`);
  console.log("\nHesaplar:");
  console.log("  admin@moveleague.com       (admin)");
  console.log("  ayse@moveleague.com        (dancer)");
  console.log("  carlos@moveleague.com      (dancer)");
  console.log("  mehmet@moveleague.com      (judge)");
  console.log("  lisa@moveleague.com        (judge)");
  console.log("  flamingo@moveleague.com    (studio)");
  console.log("  groove@moveleague.com      (studio)");
  console.log("  pulse@moveleague.com       (studio)");
  console.log("  vibe@moveleague.com        (studio)");
  console.log("  deniz@moveleague.com       (coach)");
}

seed().catch(console.error);
