import { createClient } from "@supabase/supabase-js";

// ✅ Ambil env dari Railway
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Environment variables SUPABASE_URL / SUPABASE_SERVICE_KEY tidak ditemukan!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
console.log("🚀 Private Chat Presence Checker Service Started (interval 15s, cutoff 20s, safe timing)");

// ✅ Fungsi update offline untuk user1 & user2 - SAFE timing untuk menghindari false positive
async function setUsersOffline() {
  try {
    // ✅ SAFE: Cutoff 20 detik untuk memberikan buffer yang lebih besar
    // Flutter ping setiap 5 detik, Railway cek setiap 15 detik dengan cutoff 20 detik
    // Dalam 20 detik, Flutter akan ping 4 kali (detik ke-5, 10, 15, 20)
    // ✅ PERBAIKAN: Gunakan UTC untuk konsistensi dengan Flutter (.toUtc().toISOString())
    const cutoff = new Date(Date.now() - 20000).toISOString(); // FIX: cukup gunakan UTC
    console.log(`🔍 Mengecek user idle >20s di private_chats... [${new Date().toISOString()}]`);
    console.log(`🕐 Cutoff time (UTC): ${cutoff}`);

    // ✅ 1. Update user1 jika benar-benar idle - SAFE timing
    const { data: data1, error: error1 } = await supabase
      .from("private_chats")
      .update({ 
        user1_status: "offline",
        user1_status_ping: `offline@${Date.now()}`,
        user1_status_ping_updated_at: new Date().toISOString()
      })
      .lt("user1_status_ping_updated_at", cutoff)  // ✅ hanya jika timestamp < cutoff (20s)
      .eq("user1_status", "online")               // ✅ hanya jika status masih online
      .not("user1_status_ping_updated_at", "is", null) // ✅ pastikan ada timestamp
      .not("user1_status_ping", "like", "offline%")    // ✅ jangan update jika ping sudah offline
      .select("id, user1_status_ping_updated_at, user1_id");

    if (error1) {
      console.error("❌ Gagal update user1 offline:", error1);
    } else if (data1?.length) {
      console.log(`✅ ${data1.length} user1 idle >20s di-set offline:`);
      data1.forEach(u => console.log(`   • ChatID: ${u.id} | UserID: ${u.user1_id} | Last Ping: ${u.user1_status_ping_updated_at}`));
    } else {
      console.log("✅ Tidak ada user1 idle >20s.");
    }

    // ✅ 2. Update user2 jika benar-benar idle - SAFE timing
    const { data: data2, error: error2 } = await supabase
      .from("private_chats")
      .update({ 
        user2_status: "offline",
        user2_status_ping: `offline@${Date.now()}`,
        user2_status_ping_updated_at: new Date().toISOString()
      })
      .lt("user2_status_ping_updated_at", cutoff)  // ✅ hanya jika timestamp < cutoff (20s)
      .eq("user2_status", "online")
      .not("user2_status_ping_updated_at", "is", null)
      .not("user2_status_ping", "like", "offline%")
      .select("id, user2_status_ping_updated_at, user2_id");

    if (error2) {
      console.error("❌ Gagal update user2 offline:", error2);
    } else if (data2?.length) {
      console.log(`✅ ${data2.length} user2 idle >20s di-set offline:`);
      data2.forEach(u => console.log(`   • ChatID: ${u.id} | UserID: ${u.user2_id} | Last Ping: ${u.user2_status_ping_updated_at}`));
    } else {
      console.log("✅ Tidak ada user2 idle >20s.");
    }

  } catch (err) {
    console.error("🔥 Error runtime:", err);
  }
}

// ✅ SAFE: Jalankan setiap 15 detik untuk memberikan waktu lebih cukup
setInterval(setUsersOffline, 15000);
