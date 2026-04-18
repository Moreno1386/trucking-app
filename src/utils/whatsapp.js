const CONFIG_KEY = 'wa_config';
const LAST_SENT_KEY = 'wa_last_sent';

export function getWAConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY)) || { phone: '', apikey: '' };
  } catch {
    return { phone: '', apikey: '' };
  }
}

export function saveWAConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export async function sendWhatsApp(phone, apikey, text) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${apikey}`;
  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

export function getLastSentDate() {
  return localStorage.getItem(LAST_SENT_KEY) || '';
}

export function setLastSentDate(dateStr) {
  localStorage.setItem(LAST_SENT_KEY, dateStr);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
