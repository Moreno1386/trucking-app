import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Phone, Key, Send, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { getWAConfig, saveWAConfig, sendWhatsApp } from '../utils/whatsapp';
import { supabase } from '../lib/supabase';
import useFleetStore from '../store/useFleetStore';

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

export default function Settings() {
  const getAlerts = useFleetStore((s) => s.getAlerts);
  const [config, setConfig] = useState({ phone: '', apikey: '' });
  const [status, setStatus] = useState(null); // 'sending' | 'ok' | 'error'
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig(getWAConfig());
  }, []);

  const handleSave = async () => {
    const cfg = { phone: config.phone.trim(), apikey: config.apikey.trim() };
    saveWAConfig(cfg);
    // Guardar también en Supabase para notificaciones automáticas
    await supabase.from('settings').upsert({ key: 'wa_config', value: cfg });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    if (!config.phone || !config.apikey) {
      alert('Ingresa teléfono y API key primero.');
      return;
    }
    setStatus('sending');
    const ok = await sendWhatsApp(
      config.phone,
      config.apikey,
      '✅ Chaires Trucking: Notificaciones de WhatsApp configuradas correctamente.'
    );
    setStatus(ok ? 'ok' : 'error');
    setTimeout(() => setStatus(null), 4000);
  };

  const handleSendNow = async () => {
    if (!config.phone || !config.apikey) {
      alert('Configura tu teléfono y API key primero.');
      return;
    }
    const alerts = getAlerts();
    if (alerts.length === 0) {
      alert('No hay alertas activas en este momento.');
      return;
    }
    setStatus('sending');
    const lines = ['🚨 *Chaires Trucking — Alertas*', ''];
    alerts.forEach((a) => {
      const icon = a.severity === 'high' ? '🔴' : '🟡';
      lines.push(`${icon} *${a.titulo}*`);
      lines.push(`   ${a.mensaje}`);
      lines.push(`   ${a.detalle}`);
      lines.push('');
    });
    const ok = await sendWhatsApp(config.phone, config.apikey, lines.join('\n'));
    setStatus(ok ? 'ok' : 'error');
    setTimeout(() => setStatus(null), 4000);
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" /> Configuración
        </h1>
        <p className="text-gray-500 text-sm">Notificaciones de WhatsApp vía CallMeBot</p>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm">
          <Info className="w-4 h-4" /> Cómo obtener tu API key de CallMeBot
        </div>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Guarda el número <strong>+34 644 597 079</strong> en tus contactos como "CallMeBot"</li>
          <li>Manda un WhatsApp a ese número con el texto: <strong>I allow callmebot to send me messages</strong></li>
          <li>Recibirás tu API key en unos segundos</li>
          <li>Pega el teléfono y la API key abajo y guarda</li>
        </ol>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Número de WhatsApp (con código de país, sin +)
          </label>
          <input
            type="text"
            placeholder="5213321786677"
            value={config.phone}
            onChange={(e) => setConfig((c) => ({ ...c, phone: e.target.value }))}
            className={inp}
          />
          <p className="text-xs text-gray-400 mt-1">Ejemplo: 5213321786677 (México +52, área 33, número)</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            API Key de CallMeBot
          </label>
          <input
            type="text"
            placeholder="1234567"
            value={config.apikey}
            onChange={(e) => setConfig((c) => ({ ...c, apikey: e.target.value }))}
            className={inp}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-red-700 hover:bg-red-800 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            {saved ? '¡Guardado!' : 'Guardar configuración'}
          </button>
          <button
            onClick={handleTest}
            disabled={status === 'sending'}
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <Send className="w-4 h-4" />
            {status === 'sending' ? 'Enviando...' : 'Probar'}
          </button>
        </div>

        {status === 'ok' && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
            <CheckCircle className="w-4 h-4" /> Mensaje enviado correctamente
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
            <AlertCircle className="w-4 h-4" /> Error al enviar. Verifica el teléfono y API key.
          </div>
        )}
      </div>

      {/* Enviar alertas ahora */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-1">Enviar alertas ahora</h2>
        <p className="text-sm text-gray-500 mb-4">
          Manda un resumen de todas las alertas activas (aceite, seguros, tarjetas) a WhatsApp de inmediato.
        </p>
        <button
          onClick={handleSendNow}
          disabled={status === 'sending'}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          <Send className="w-4 h-4" />
          {status === 'sending' ? 'Enviando...' : 'Enviar alertas a WhatsApp'}
        </button>
      </div>

      {/* Info de alertas automáticas */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-700 mb-1">Alertas automáticas</p>
        <p>La app envía notificaciones automáticamente una vez al día cuando detecta:</p>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>Cambio de aceite vencido o próximo (menos de 2,000 km)</li>
          <li>Póliza de seguro vencida o que vence en menos de 30 días</li>
          <li>Pago de tarjeta de crédito en los próximos 5 días</li>
        </ul>
      </div>
    </div>
  );
}
