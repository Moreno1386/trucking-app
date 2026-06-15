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

// Días de anticipación para avisos de vencimiento próximo
const DIAS_AVISO = 5;

// Devuelve alertas ROJAS (vencidas / hoy) y PRÓXIMAS (vencen en <= DIAS_AVISO días)
function getAlerts(trucks, drivers, insurances, creditCards, mensualidades) {
  const red = [];
  const upcoming = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Cambio de aceite vencido
  trucks.forEach((truck) => {
    const kmSince = (truck.kilometraje_actual || 0) - (truck.ultimo_cambio_aceite || 0);
    const interval = truck.intervalo_cambio_aceite || 10000;
    const remaining = interval - kmSince;
    if (remaining <= 0) {
      red.push(`🔴 *Cambio de aceite VENCIDO*\n   Unidad ${truck.numero_unidad} — ${truck.marca} ${truck.modelo}\n   Vencido por ${Math.abs(remaining).toLocaleString('es-MX')} km`);
    }
  });

  // Licencias
  drivers.forEach((driver) => {
    if (!driver.licencia_vencimiento) return;
    const exp = new Date(driver.licencia_vencimiento + 'T12:00:00');
    const days = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    const fullName = `${driver.nombre} ${driver.apellido_paterno} ${driver.apellido_materno || ''}`.trim();
    if (days < 0) {
      red.push(`🔴 *Licencia VENCIDA*\n   ${fullName} (${driver.numero_empleado})\n   Venció el ${exp.toLocaleDateString('es-MX')}`);
    } else if (days === 0) {
      red.push(`🔴 *Licencia vence HOY*\n   ${fullName} (${driver.numero_empleado})`);
    } else if (days <= DIAS_AVISO) {
      upcoming.push(`🟠 *Licencia por vencer*\n   ${fullName} (${driver.numero_empleado})\n   Vence en ${days} día${days !== 1 ? 's' : ''} (${exp.toLocaleDateString('es-MX')})`);
    }
  });

  // Pólizas de seguro
  insurances.forEach((ins) => {
    if (!ins.fecha_vencimiento || ins.estado !== 'activo') return;
    const exp = new Date(ins.fecha_vencimiento + 'T12:00:00');
    const days = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    if (days < 0) {
      red.push(`🔴 *Póliza de seguro VENCIDA*\n   ${ins.aseguradora} — Póliza ${ins.numero_poliza}\n   Venció el ${exp.toLocaleDateString('es-MX')}`);
    } else if (days === 0) {
      red.push(`🔴 *Póliza de seguro vence HOY*\n   ${ins.aseguradora} — Póliza ${ins.numero_poliza}`);
    } else if (days <= DIAS_AVISO) {
      upcoming.push(`🟠 *Póliza por vencer*\n   ${ins.aseguradora} — Póliza ${ins.numero_poliza}\n   Vence en ${days} día${days !== 1 ? 's' : ''} (${exp.toLocaleDateString('es-MX')})`);
    }
  });

  // Tarjetas de crédito
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
    const saldo = `Saldo: $${Number(card.saldo).toLocaleString('es-MX')}`;
    if (days === 0) {
      red.push(`🔴 *Pago de tarjeta HOY*\n   ${card.banco} ${card.tipo} ****${last4}\n   ${saldo}`);
    } else if (days <= DIAS_AVISO) {
      upcoming.push(`🟠 *Pago de tarjeta próximo*\n   ${card.banco} ${card.tipo} ****${last4}\n   Vence en ${days} día${days !== 1 ? 's' : ''} (${dueDate.toLocaleDateString('es-MX')}) — ${saldo}`);
    }
  });

  // Mensualidades de vehículos
  (mensualidades || []).forEach((m) => {
    if (!m.dia_pago || m.estado === 'liquidado') return;
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const dueDate = m.dia_pago >= currentDay
      ? new Date(currentYear, currentMonth, m.dia_pago)
      : new Date(currentYear, currentMonth + 1, m.dia_pago);
    const days = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    const monto = `Mensualidad: $${Number(m.pago_mensual).toLocaleString('es-MX')}`;
    if (days === 0) {
      red.push(`🔴 *Mensualidad de vehículo HOY*\n   ${m.vehiculo}\n   ${monto}`);
    } else if (days <= DIAS_AVISO) {
      upcoming.push(`🟠 *Mensualidad de vehículo próxima*\n   ${m.vehiculo}\n   Vence en ${days} día${days !== 1 ? 's' : ''} (${dueDate.toLocaleDateString('es-MX')}) — ${monto}`);
    }
  });

  return { red, upcoming };
}

export default async function handler(req, res) {
  try {
    // Guard: solo enviar una vez por día
    const todayStr = new Date().toISOString().slice(0, 10); // "2026-04-27"
    const { data: lastSentRow } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'tg_last_sent')
      .maybeSingle();

    if (lastSentRow?.value === todayStr) {
      return res.status(200).json({ message: `Notificación ya enviada hoy (${todayStr}). Saltando.` });
    }

    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'tg_config')
      .single();

    if (!settings?.value?.token || !settings?.value?.chatId) {
      return res.status(200).json({ message: 'Telegram no configurado.' });
    }

    const { token, chatId } = settings.value;

    const [t, d, i, cc, me] = await Promise.all([
      supabase.from('trucks').select('*'),
      supabase.from('drivers').select('*'),
      supabase.from('insurances').select('*'),
      supabase.from('credit_cards').select('*'),
      supabase.from('mensualidades_vehiculos').select('*'),
    ]);

    const { red, upcoming } = getAlerts(t.data || [], d.data || [], i.data || [], cc.data || [], me.data || []);
    const totalAlerts = red.length + upcoming.length;

    if (totalAlerts === 0) {
      return res.status(200).json({ message: 'Sin alertas hoy.' });
    }

    const today = new Date().toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const parts = [
      `🚨 *CHAIRES TRUCKING — Alertas del Día*`,
      `_${today}_`,
    ];
    if (red.length > 0) {
      parts.push(``, `⚠️ *ATENCIÓN INMEDIATA*`, ...red);
    }
    if (upcoming.length > 0) {
      parts.push(``, `📅 *PRÓXIMOS ${DIAS_AVISO} DÍAS*`, ...upcoming);
    }
    const message = parts.join('\n\n');

    const ok = await sendTelegram(token, chatId, message);

    if (ok) {
      // Guardar fecha de hoy para evitar duplicados
      if (lastSentRow) {
        await supabase.from('settings').update({ value: todayStr }).eq('key', 'tg_last_sent');
      } else {
        await supabase.from('settings').insert({ key: 'tg_last_sent', value: todayStr });
      }
    }

    return res.status(200).json({
      message: ok ? `Notificación enviada: ${red.length} urgente(s), ${upcoming.length} próxima(s).` : 'Error al enviar Telegram.',
      alerts: totalAlerts,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
