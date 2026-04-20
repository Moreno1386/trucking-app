const CONFIG_KEY = 'tg_config';
const LAST_SENT_KEY = 'tg_last_sent';

export function getTGConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY)) || { token: '', chatId: '' };
  } catch {
    return { token: '', chatId: '' };
  }
}

export function saveTGConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export async function sendTelegram(token, chatId, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
    const data = await res.json();
    return data.ok === true;
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
