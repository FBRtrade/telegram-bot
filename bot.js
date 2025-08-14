import fs from "fs";
import fetch from "node-fetch";

const BITGET_API_URL = "https://api.bitget.com/api/spot/v1/public/products"; // URL Bitget
const TELEGRAM_BOT_TOKEN = "8094657830:AAHVMAU5OHSrOUJDAH863jRKvABVwTVA8Nw";
const TELEGRAM_CHAT_ID = "7495874322";
const STORAGE_FILE = "./pairs.json"; // Nouveau fichier pour stocker les paires

// Lire les paires précédentes depuis le fichier
function getPreviousPairs() {
  if (!fs.existsSync(STORAGE_FILE)) return [];
  const data = fs.readFileSync(STORAGE_FILE, "utf-8");
  try {
    return JSON.parse(data).pairs || [];
  } catch {
    return [];
  }
}

// Sauvegarder les paires actuelles
function saveCurrentPairs(pairs) {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify({ pairs }), "utf-8");
}

// Envoyer un message Telegram
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
    const response = await fetch(BITGET_API_URL);
    const data = await response.json();

    if (!data?.data || !Array.isArray(data.data)) {
      console.log("Impossible de récupérer la liste des paires.");
      return;
    }

    const currentPairs = data.data.map(p => p.symbol); // récupérer le nom exact des paires
    const previousPairs = getPreviousPairs();

    // Comparer les paires
    const newPairs = currentPairs.filter(p => !previousPairs.includes(p));
    const removedPairs = previousPairs.filter(p => !currentPairs.includes(p));

    if (newPairs.length > 0) {
      console.log(`🚀 Nouvelles paires détectées: ${newPairs.join(", ")}`);
      await sendTelegramMessage(`🚀 Nouvelles paires Bitget: ${newPairs.join(", ")}`);
    }

    if (removedPairs.length > 0) {
      console.log(`⚠️ Paires supprimées: ${removedPairs.join(", ")}`);
      await sendTelegramMessage(`⚠️ Paires retirées Bitget: ${removedPairs.join(", ")}`);
    }

    if (newPairs.length === 0 && removedPairs.length === 0) {
      console.log("Aucun changement de paires détecté.");
    }

    // Sauvegarde
    saveCurrentPairs(currentPairs);

  } catch (error) {
    console.error("Erreur :", error);
  }
}

main();
