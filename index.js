import { createClient } from "@supabase/supabase-js";

// ✅ Ambil env dari Railway
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Environment variables SUPABASE_URL / SUPABASE_SERVICE_KEY tidak ditemukan!");
  process.exit(1);
}

// ✅ Buat client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log("🚀 Presence Checker Service Started");

async function setUsersOffline() {
  try {
    const cutoff = new Date(Date.now() - 8000).toISOString(); // ✅ idle >8s dianggap offline
    console.log(`🔍 Mengecek user idle >8s... [${new Date().toISOString()}]`);

    const { data, error } = await supabase
      .from("users")
      .update({ status: "offline" })
      .lt("status_ping_updated_at", cutoff)   // ✅ gunakan kolom timestamp valid
      .eq("status", "online")                 // ✅ hanya ubah yang online
      .select("id");

    if (error) {
      console.error("❌ Gagal update user offline:", error);
    } else {
      if (data?.length) {
        console.log(`✅ ${data.length} user idle >8s di-set offline:`, data.map(u => u.id));
      } else {
        console.log("✅ Tidak ada user idle >8s.");
      }
    }
  } catch (err) {
    console.error("🔥 Error runtime:", err);
  }
}

// ✅ Jalankan setiap 5 detik
setInterval(setUsersOffline, 5000);
