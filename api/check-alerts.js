import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mvlwxtlmqiqabpytgayb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bHd4dGxtcWlxYWJweXRnYXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDYwOTMsImV4cCI6MjA5MTUyMjA5M30.6qs_VrmByUxdadn72RPMfPgPiPkHDuZPjJLO-6-NAnQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sendTelegram(token, chatId, text) {
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

function getAlerts(trucks, drivers, insurances, creditCards) {
  const alerts = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  trucks.forEach((truck) => {
    const kmSince = (truck.kilometraje_actual || 0) - (truck.ultimo_cambio_aceite || 0);
    const interval = truck.intervalo_cambio_aceite || 10000;
    const remaining = interval - kmSince;
    if (remaining <= 0) {
      alerts.push(`🔴 *Cambio de aceite VENCIDO*\n   Unidad ${truck.numero_unidad} — ${truck.marca} ${truck.modelo}\n   Vencido por ${Math.abs(remaining).toLocaleString('es-MX')} km`);
    } else if (remaining <= 2000) {
      alerts.push(`🟡 *Cambio de aceite próximo*\n   Unidad ${truck.numero_unidad} — ${truck.marca} ${truck.modelo}\n   Faltan ${remaining.toLocaleString('es-MX')} km`);
    }
  });

  drivers.forEach((driver) => {
    if (!driver.licencia_vencimiento) return;
    const exp = new Date(driver.licencia_vencimiento + 'T12:00:00');
    const days = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    const fullName = `${driver.nombre} ${driver.apellido_paterno} ${driver.apellido_materno || ''}`.trim();
    if (days < 0) {
      alerts.push(`🔴 *Licencia VENCIDA*\n   ${fullName} (${driver.numero_empleado})\n   Venció el ${exp.toLocaleDateString('es-MX')}`);
    } else if (days <= 30) {
      alerts.push(`🟡 *Licencia próxima a vencer*\n   ${fullName} (${driver.numero_empleado})\n   Vence en ${days} días`);
    }
  });

  insurances.forEach((ins) => {
    if (!ins.fecha_vencimiento || ins.estado !== 'activo') return;
    const exp = new Date(ins.fecha_vencimiento + 'T12:00:00');
    const days = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    if (days < 0) {
      alerts.push(`🔴 *Póliza VENCIDA*\n   ${ins.aseguradora} — Póliza ${ins.numero_poliza}\n   Venció el ${exp.toLocaleDateString('es-MX')}`);
    } else if (days <= 30) {
      alerts.push(`🟡 *Póliza próxima a vencer*\n   ${ins.aseguradora} — Póliza ${ins.numero_poliza}\n   Vence en ${days} días`);
    }
  });

  creditCards.forEach((card) => {
    if (!card.dia_pago) return;
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const dueDate = card.dia_pago >= currentDay
      ? new Date(currentYear, currentMonth, card.dia_pago)
      : new Date(currentYear, currentMonth + 1, card.dia_pago);
    const days = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    const last4 = String(card.numero_tarjeta).slice(-4);
    if (days === 0) {
      alerts.push(`🔴 *Pago de tarjeta HOY*\n   ${card.banco} ${card.tipo} ****${last4}\n   Saldo: $${Number(card.saldo).toLocaleString('es-MX')}`);
    } else if (days <= 5) {
      alerts.push(`🟡 *Pago de tarjeta en ${days} días*\n   ${card.banco} ${card.tipo} ****${last4}\n   Saldo: $${Number(card.saldo).toLocaleString('es-MX')}`);
    }
  });

  return alerts;
}

export default async function handler(req, res) {
  try {
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'tg_config')
      .single();

    if (!settings?.value?.token || !settings?.value?.chatId) {
      return res.status(200).json({ message: 'Telegram no configurado.' });
    }

    const { token, chatId } = settings.value;

    const [t, d, i, cc] = await Promise.all([
      supabase.from('trucks').select('*'),
      supabase.from('drivers').select('*'),
      supabase.from('insurances').select('*'),
      supabase.from('credit_cards').select('*'),
    ]);

    const alerts = getAlerts(t.data || [], d.data || [], i.data || [], cc.data || []);

    if (alerts.length === 0) {
      return res.status(200).json({ message: 'Sin alertas activas.' });
    }

    const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const message = [`🚨 *Chaires Trucking — Alertas*\n_${today}_`, '', ...alerts].join('\n\n');

    const ok = await sendTelegram(token, chatId, message);

    return res.status(200).json({
      message: ok ? `Notificación enviada con ${alerts.length} alerta(s).` : 'Error al enviar Telegram.',
      alerts: alerts.length,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
