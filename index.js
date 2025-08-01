import { createClient } from "@supabase/supabase-js";

// ✅ Ambil env dari Railway
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Environment variables SUPABASE_URL / SUPABASE_SERVICE_KEY tidak ditemukan!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
console.log("🚀 Presence Checker Service Started (interval 2s, cutoff 7s, anti-override)");

// ✅ Fungsi update offline untuk user1 & user2
async function setUsersOffline() {
  try {
    const cutoff = new Date(Date.now() - 7000).toISOString(); // idle >7s dianggap offline
    console.log(`🔍 Mengecek user idle >7s di private_chats... [${new Date().toISOString()}]`);

    // ✅ 1. Update user1 jika benar-benar idle
    const { data: data1, error: error1 } = await supabase
      .from("private_chats")
      .update({ user1_status: "offline" })
      .lt("user1_status_ping_updated_at", cutoff)  // ✅ hanya jika timestamp < cutoff
      .eq("user1_status", "online")               // ✅ hanya jika status masih online
      .not("user1_status_ping_updated_at", "is", null) // ✅ pastikan ada timestamp
      .select("id, user1_status_ping_updated_at");

    if (error1) {
      console.error("❌ Gagal update user1 offline:", error1);
    } else if (data1?.length) {
      console.log(`✅ ${data1.length} user1 idle >7s di-set offline:`);
      data1.forEach(u => console.log(`   • ChatID: ${u.id} | Last Ping: ${u.user1_status_ping_updated_at}`));
    } else {
      console.log("✅ Tidak ada user1 idle >7s.");
    }

    // ✅ 2. Update user2 jika benar-benar idle
    const { data: data2, error: error2 } = await supabase
      .from("private_chats")
      .update({ user2_status: "offline" })
      .lt("user2_status_ping_updated_at", cutoff)
      .eq("user2_status", "online")
      .not("user2_status_ping_updated_at", "is", null)
      .select("id, user2_status_ping_updated_at");

    if (error2) {
      console.error("❌ Gagal update user2 offline:", error2);
    } else if (data2?.length) {
      console.log(`✅ ${data2.length} user2 idle >7s di-set offline:`);
      data2.forEach(u => console.log(`   • ChatID: ${u.id} | Last Ping: ${u.user2_status_ping_updated_at}`));
    } else {
      console.log("✅ Tidak ada user2 idle >7s.");
    }

  } catch (err) {
    console.error("🔥 Error runtime:", err);
  }
}

// ✅ Jalankan setiap 2 detik
setInterval(setUsersOffline, 2000);
