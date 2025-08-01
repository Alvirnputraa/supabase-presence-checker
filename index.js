import { createClient } from "@supabase/supabase-js";

// ✅ Ambil env dari Railway
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Environment variables SUPABASE_URL / SUPABASE_SERVICE_KEY tidak ditemukan!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
console.log("🚀 Presence Checker Service Started (interval 2s, cutoff 5s)");

// ✅ Fungsi update offline untuk user1 & user2
async function setUsersOffline() {
  try {
    const cutoff = new Date(Date.now() - 5000).toISOString(); // idle >5s dianggap offline
    console.log(`🔍 Mengecek user idle >5s di private_chats... [${new Date().toISOString()}]`);

    // ✅ 1. Update untuk user1
    const { data: data1, error: error1 } = await supabase
      .from("private_chats")
      .update({ user1_status: "offline" })
      .lt("user1_status_ping_updated_at", cutoff)
      .eq("user1_status", "online")
      .select("id");

    if (error1) {
      console.error("❌ Gagal update user1 offline:", error1);
    } else if (data1?.length) {
      console.log(`✅ ${data1.length} user1 idle >5s di-set offline:`, data1.map(u => u.id));
    } else {
      console.log("✅ Tidak ada user1 idle >5s.");
    }

    // ✅ 2. Update untuk user2
    const { data: data2, error: error2 } = await supabase
      .from("private_chats")
      .update({ user2_status: "offline" })
      .lt("user2_status_ping_updated_at", cutoff)
      .eq("user2_status", "online")
      .select("id");

    if (error2) {
      console.error("❌ Gagal update user2 offline:", error2);
    } else if (data2?.length) {
      console.log(`✅ ${data2.length} user2 idle >5s di-set offline:`, data2.map(u => u.id));
    } else {
      console.log("✅ Tidak ada user2 idle >5s.");
    }

  } catch (err) {
    console.error("🔥 Error runtime:", err);
  }
}

// ✅ Jalankan setiap 2 detik
setInterval(setUsersOffline, 2000);
