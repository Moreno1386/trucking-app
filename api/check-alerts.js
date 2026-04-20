import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mvlwxtlmqiqabpytgayb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bHd4dGxtcWlxYWJweXRnYXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDYwOTMsImV4cCI6MjA5MTUyMjA5M30.6qs_VrmByUxdadn72RPMfPgPiPkHDuZPjJLO-6-NAnQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sendWhatsApp(phone, apikey, text) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${apikey}`;
  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

function getAlerts(trucks, drivers, insurances, creditCards) {
  const alerts = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Aceite
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

  // Licencias
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

  // Seguros
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

  // Tarjetas
  creditCards.forEach((card) => {
    if (!card.dia_pago) return;
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let dueDate;
    if (card.dia_pago >= currentDay) {
      dueDate = new Date(currentYear, currentMonth, card.dia_pago);
    } else {
      dueDate = new Date(currentYear, currentMonth + 1, card.dia_pago);
    }
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
    // Leer configuración de WhatsApp desde Supabase
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'wa_config')
      .single();

    if (!settings?.value?.phone || !settings?.value?.apikey) {
      return res.status(200).json({ message: 'WhatsApp no configurado, saltando notificaciones.' });
    }

    const { phone, apikey } = settings.value;

    // Cargar datos
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
    const message = [`🚨 *Chaires Trucking — Alertas ${today}*`, '', ...alerts].join('\n\n');

    const ok = await sendWhatsApp(phone, apikey, message);

    return res.status(200).json({
      message: ok ? `Notificación enviada con ${alerts.length} alerta(s).` : 'Error al enviar WhatsApp.',
      alerts: alerts.length
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
