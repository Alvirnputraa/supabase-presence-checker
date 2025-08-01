import { createClient } from "@supabase/supabase-js";

// Ambil dari Railway Environment Variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Buat client Supabase dengan Service Role Key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setUsersOffline() {
  console.log("🔍 Mengecek user yang idle...");

  const { error } = await supabase
    .from("users")
    .update({ status: "offline" })
    .lt("status_ping", new Date(Date.now() - 15000).toISOString());

  if (error) {
    console.error("❌ Gagal update user offline:", error);
  } else {
    console.log("✅ User idle >15s berhasil di-set offline.");
  }
}

// Jalankan setiap 15 detik
setInterval(setUsersOffline, 15000);
