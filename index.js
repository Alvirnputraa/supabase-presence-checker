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
    // Ambil semua user yang status online dan ping tidak berubah lebih dari cutoff + buffer
    const bufferMs = 3000; // 3 detik buffer
    const cutoffMs = 20000 + bufferMs;
    const cutoff = new Date(Date.now() - cutoffMs).toISOString();
    // 1. Cari user1 yang status online dan ping tidak berubah > cutoff + buffer
    const { data: data1, error: error1 } = await supabase
      .from("private_chats")
      .select("id, user1_status_ping_updated_at, user1_status_ping, user1_id")
      .eq("user1_status", "online")
      .not("user1_status_ping_updated_at", "is", null)
      .not("user1_status_ping", "like", "offline%")
      .lt("user1_status_ping_updated_at", cutoff);
    // 2. Update user1 ke offline jika benar-benar idle
    if (data1?.length) {
      for (const u of data1) {
        await supabase
          .from("private_chats")
          .update({
            user1_status: "offline",
            user1_status_ping: `offline@${Date.now()}`,
            user1_status_ping_updated_at: new Date().toISOString()
          })
          .eq("id", u.id);
        console.log(`✅ User1 idle >${cutoffMs/1000}s di-set offline: ChatID: ${u.id} | UserID: ${u.user1_id} | Last Ping: ${u.user1_status_ping_updated_at}`);
      }
    } else {
      console.log("✅ Tidak ada user1 idle >20s + buffer.");
    }
    // 3. Cari user2 yang status online dan ping tidak berubah > cutoff + buffer
    const { data: data2, error: error2 } = await supabase
      .from("private_chats")
      .select("id, user2_status_ping_updated_at, user2_status_ping, user2_id")
      .eq("user2_status", "online")
      .not("user2_status_ping_updated_at", "is", null)
      .not("user2_status_ping", "like", "offline%")
      .lt("user2_status_ping_updated_at", cutoff);
    // 4. Update user2 ke offline jika benar-benar idle
    if (data2?.length) {
      for (const u of data2) {
        await supabase
          .from("private_chats")
          .update({
            user2_status: "offline",
            user2_status_ping: `offline@${Date.now()}`,
            user2_status_ping_updated_at: new Date().toISOString()
          })
          .eq("id", u.id);
        console.log(`✅ User2 idle >${cutoffMs/1000}s di-set offline: ChatID: ${u.id} | UserID: ${u.user2_id} | Last Ping: ${u.user2_status_ping_updated_at}`);
      }
    } else {
      console.log("✅ Tidak ada user2 idle >20s + buffer.");
    }

  } catch (err) {
    console.error("🔥 Error runtime:", err);
  }
}

// ✅ SAFE: Jalankan setiap 15 detik untuk memberikan waktu lebih cukup
setInterval(setUsersOffline, 17000);
