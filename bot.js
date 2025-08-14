import fs from "fs";
import fetch from "node-fetch";

const BITGET_API_URL = "https://api.bitget.com/api/spot/v1/public/products";
const TELEGRAM_BOT_TOKEN = "TON_TOKEN_TELEGRAM"; // <-- Mets ton token
const TELEGRAM_CHAT_ID = "TON_CHAT_ID"; // <-- Mets ton chat ID
const STORAGE_FILE = "./count.json";

function getPreviousPairs() {
  if (!fs.existsSync(STORAGE_FILE)) {
    return [];
  }
  const data = fs.readFileSync(STORAGE_FILE, "utf-8");
  try {
    return JSON.parse(data).pairs || [];
  } catch {
    return [];
  }
}

function saveCurrentPairs(pairs) {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify({ pairs }), "utf-8");
}

async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body = {
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: "Markdown"
  };

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function checkBitget() {
  try {
    const response = await fetch(BITGET_API_URL);
    const data = await response.json();

    if (!data?.data || !Array.isArray(data.data)) {
      console.log("Impossible de récupérer la liste des paires.");
      return;
    }

    const currentPairs = data.data.map(item => item.symbol);
    const previousPairs = getPreviousPairs();

    const newPairs = currentPairs.filter(p => !previousPairs.includes(p));

    if (newPairs.length > 0) {
      console.log("🚀 Nouvelle(s) paire(s) détectée(s) :", newPairs);

      for (const pair of newPairs) {
        const link = `https://www.bitget.com/fr/spot/${pair.toLowerCase()}`;
        await sendTelegramMessage(`🚀 Nouvelle crypto listée : *${pair}*\n🔗 [Voir sur Bitget](${link})`);
      }
    } else {
      console.log("Aucune nouvelle paire détectée.");
    }

    saveCurrentPairs(currentPairs);

  } catch (error) {
    console.error("Erreur :", error);
  }
}

console.log("📡 Surveillance Bitget démarrée...");

// Lancement immédiat + toutes les 2 minutes
checkBitget();
setInterval(checkBitget, 2 * 60 * 1000);
	
