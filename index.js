import { createClient } from "@supabase/supabase-js";

// ✅ Ambil env dari Railway
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Environment variables SUPABASE_URL / SUPABASE_SERVICE_KEY tidak ditemukan!");
  process.exit(1); // Jangan lanjut kalau env tidak ada
}

// ✅ Buat client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log("🚀 Presence Checker Service Started");

async function setUsersOffline() {
  try {
    console.log(`🔍 Mengecek user yang idle... [${new Date().toISOString()}]`);

    const cutoff = new Date(Date.now() - 15000).toISOString();

    const { data, error } = await supabase
      .from("users")
      .update({ status: "offline" })
      .lt("status_ping_updated_at", cutoff)   // ✅ pakai kolom timestamp yang benar
      .eq("status", "online")                 // ✅ hanya update yang statusnya masih online
      .select("id");                           // ✅ ambil id user yang diupdate (opsional logging)

    if (error) {
      console.error("❌ Gagal update user offline:", error);
    } else {
      if (data && data.length > 0) {
        console.log(`✅ ${data.length} user idle >15s di-set offline:`, data.map(u => u.id));
      } else {
        console.log("✅ Tidak ada user idle >15s.");
      }
    }
  } catch (err) {
    console.error("🔥 Error runtime:", err);
  }
}

// ✅ Jalankan setiap 15 detik
setInterval(setUsersOffline, 15000);
