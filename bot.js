import fs from "fs";
import fetch from "node-fetch";

const BITGET_API_URL = "https://api.bitget.com/api/spot/v1/public/products"; // URL Bitget
const TELEGRAM_BOT_TOKEN = "8094657830:AAHVMAU5OHSrOUJDAH863jRKvABVwTVA8Nw"; // ⚠️ Remplace par ton token
const TELEGRAM_CHAT_ID = "7495874322";           // ⚠️ Remplace par ton chat id
const STORAGE_FILE = "./count.json"; // Fichier local pour stocker le count

// Lire la valeur précédente depuis le fichier
function getPreviousCount() {
  if (!fs.existsSync(STORAGE_FILE)) {
    return 0;
  }
  const data = fs.readFileSync(STORAGE_FILE, "utf-8");
  try {
    return JSON.parse(data).previousCount || 0;
  } catch {
    return 0;
  }
}

// Sauvegarder le nouveau count
function saveCurrentCount(count) {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify({ previousCount: count }), "utf-8");
}

// Envoyer le message Telegram
async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body = {
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
  };

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Fonction principale
async function main() {
  try {
    // 1️⃣ Récupération du nombre de paires
    const response = await fetch(BITGET_API_URL);
    const data = await response.json();

    if (!data?.data || !Array.isArray(data.data)) {
      console.log("Impossible de récupérer la liste des paires.");
      return;
    }

    const currentCount = data.data.length;
    const previousCount = getPreviousCount();

    console.log(`Previous Count: ${previousCount}, Current Count: ${currentCount}`);

    // 2️⃣ Comparaison et envoi si nouvelle paire
    if (currentCount > previousCount) {
      console.log("🚀 Nouvelle paire détectée !");
      await sendTelegramMessage(`🚀 Nouvelle crypto listée sur Bitget ! Total : ${currentCount} paires.`);
    } else {
      console.log("Aucune nouvelle paire détectée.");
    }

    // 3️⃣ Sauvegarde du nouveau count
    saveCurrentCount(currentCount);

  } catch (error) {
    console.error("Erreur :", error);
  }
}

// Lancer le script
main();
	
