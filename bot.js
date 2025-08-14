import fs from "fs";
import fetch from "node-fetch";

// 🔹 Variables d'environnement (Render → Environment variables)
const BITGET_API_URL = "https://api.bitget.com/api/spot/v1/public/products";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const STORAGE_FILE = "./pairs.json"; // Stockage des paires connues

// 📂 Lire les anciennes paires
function getPreviousPairs() {
  if (!fs.existsSync(STORAGE_FILE)) return [];
  try {
    const data = fs.readFileSync(STORAGE_FILE, "utf-8");
    return JSON.parse(data).pairs || [];
  } catch {
    return [];
  }
}

// 💾 Sauvegarder les nouvelles paires
function saveCurrentPairs(pairs) {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify({ pairs }), "utf-8");
}

// 📢 Envoyer un message Telegram
async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body = {
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: "HTML", // pour liens cliquables
  };

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// 🚀 Fonction principale
async function main() {
  try {
    // 1️⃣ Récupération des paires actuelles
    const response = await fetch(BITGET_API_URL);
    const data = await response.json();

    if (!data?.data || !Array.isArray(data.data)) {
      console.log("Impossible de récupérer la liste des paires.");
      return;
    }

    const currentPairs = data.data.map(p => p.symbol);
    const previousPairs = getPreviousPairs();

    console.log(`Anciennes paires : ${previousPairs.length}`);
    console.log(`Paires actuelles : ${currentPairs.length}`);

    // 2️⃣ Détection des nouvelles paires
    const newPairs = currentPairs.filter(p => !previousPairs.includes(p));

    if (newPairs.length > 0) {
      console.log("🚀 Nouvelles paires détectées :", newPairs);

      // Construction du message avec lien vers Bitget
      let message = `🚀 <b>Nouvelles cryptos listées sur Bitget :</b>\n`;
      for (let pair of newPairs) {
        const base = pair.split("/")[0]; // ex: BTCUSDT → BTC
        message += `• <a href="https://www.bitget.com/en/spot/${pair.replace("/", "_")}">${pair}</a>\n`;
      }

      await sendTelegramMessage(message);
    } else {
      console.log("Aucune nouvelle paire détectée.");
    }

    // 3️⃣ Sauvegarde des paires actuelles
    saveCurrentPairs(currentPairs);

  } catch (error) {
    console.error("Erreur :", error);
  }
}

// Lancer
main();
	
