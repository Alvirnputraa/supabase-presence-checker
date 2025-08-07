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

// Map untuk menyimpan value ping terakhir dan waktu baca
const lastPingMap = new Map();

// ✅ Fungsi update offline untuk user1 & user2 - SAFE timing untuk menghindari false positive
async function setUsersOffline() {
  try {
    const cutoffMs = 20000; // 20 detik
    const now = Date.now();
    // Ambil semua user online
    const { data: users, error } = await supabase
      .from("private_chats")
      .select("id, user1_status, user1_status_ping, user1_id, user2_status, user2_status_ping, user2_id");
    if (error) {
      console.error("❌ Gagal ambil data private_chats:", error);
      return;
    }
    // Cek user1
    for (const u of users) {
      if (u.user1_status === "online") {
        const lastPing = lastPingMap.get(`user1_${u.id}`);
        if (!lastPing || lastPing.value !== u.user1_status_ping) {
          // Value berubah, update waktu
          lastPingMap.set(`user1_${u.id}`, { value: u.user1_status_ping, time: now });
          console.log(`🔄 User1 ping berubah: ${u.user1_status_ping} (ChatID: ${u.id})`);
        } else {
          // Value tidak berubah, cek waktu
          const elapsed = now - lastPing.time;
          if (elapsed > cutoffMs) {
            await supabase
              .from("private_chats")
              .update({
                user1_status: "offline",
                user1_status_ping: `offline@${Date.now()}`
              })
              .eq("id", u.id);
            console.log(`✅ User1 idle >${cutoffMs/1000}s di-set offline: ChatID: ${u.id} | UserID: ${u.user1_id}`);
            // Reset map agar tidak update berulang
            lastPingMap.delete(`user1_${u.id}`);
          }
        }
      } else {
        // Jika status bukan online, hapus dari map
        lastPingMap.delete(`user1_${u.id}`);
      }
    }
    // Cek user2
    for (const u of users) {
      if (u.user2_status === "online") {
        const lastPing = lastPingMap.get(`user2_${u.id}`);
        if (!lastPing || lastPing.value !== u.user2_status_ping) {
          lastPingMap.set(`user2_${u.id}`, { value: u.user2_status_ping, time: now });
          console.log(`🔄 User2 ping berubah: ${u.user2_status_ping} (ChatID: ${u.id})`);
        } else {
          const elapsed = now - lastPing.time;
          if (elapsed > cutoffMs) {
            await supabase
              .from("private_chats")
              .update({
                user2_status: "offline",
                user2_status_ping: `offline@${Date.now()}`
              })
              .eq("id", u.id);
            console.log(`✅ User2 idle >${cutoffMs/1000}s di-set offline: ChatID: ${u.id} | UserID: ${u.user2_id}`);
            lastPingMap.delete(`user2_${u.id}`);
          }
        }
      } else {
        lastPingMap.delete(`user2_${u.id}`);
      }
    }
  } catch (err) {
    console.error("🔥 Error runtime:", err);
  }
}

// ✅ SAFE: Jalankan setiap 15 detik untuk memberikan waktu lebih cukup
setInterval(setUsersOffline, 17000);
