import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, Send, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { getTGConfig, saveTGConfig, sendTelegram } from '../utils/telegram';
import { supabase } from '../lib/supabase';
import useFleetStore from '../store/useFleetStore';

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

export default function Settings() {
  const getAlerts = useFleetStore((s) => s.getAlerts);
  const [config, setConfig] = useState({ token: '', chatId: '' });
  const [status, setStatus] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig(getTGConfig());
  }, []);

  const handleSave = async () => {
    const cfg = { token: config.token.trim(), chatId: config.chatId.trim() };
    saveTGConfig(cfg);
    await supabase.from('settings').upsert({ key: 'tg_config', value: cfg });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    if (!config.token || !config.chatId) {
      alert('Ingresa el Token y Chat ID primero.');
      return;
    }
    setStatus('sending');
    const ok = await sendTelegram(
      config.token,
      config.chatId,
      '✅ *Chaires Trucking*: Notificaciones de Telegram configuradas correctamente.'
    );
    setStatus(ok ? 'ok' : 'error');
    setTimeout(() => setStatus(null), 4000);
  };

  const handleSendNow = async () => {
    if (!config.token || !config.chatId) {
      alert('Configura el Token y Chat ID primero.');
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
    const ok = await sendTelegram(config.token, config.chatId, lines.join('\n'));
    setStatus(ok ? 'ok' : 'error');
    setTimeout(() => setStatus(null), 4000);
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" /> Configuración
        </h1>
        <p className="text-gray-500 text-sm">Notificaciones automáticas vía Telegram</p>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm">
          <Info className="w-4 h-4" /> Cómo configurar tu bot de Telegram (gratis)
        </div>
        <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
          <li>Abre Telegram y busca <strong>@BotFather</strong></li>
          <li>Mándale el mensaje: <strong>/newbot</strong></li>
          <li>Te pide nombre → escribe: <strong>Chaires Trucking</strong></li>
          <li>Te pide username → escribe algo como: <strong>chairestrucking_bot</strong></li>
          <li>Te dará un <strong>Token</strong> — cópialo y pégalo abajo</li>
          <li>Busca <strong>@userinfobot</strong> en Telegram y mándale cualquier mensaje</li>
          <li>Te responde con tu <strong>Chat ID</strong> — cópialo y pégalo abajo</li>
        </ol>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Token del Bot (de @BotFather)
          </label>
          <input
            type="text"
            placeholder="123456789:AABBccDDeeFFggHHii..."
            value={config.token}
            onChange={(e) => setConfig((c) => ({ ...c, token: e.target.value }))}
            className={inp}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Chat ID (de @userinfobot)
          </label>
          <input
            type="text"
            placeholder="123456789"
            value={config.chatId}
            onChange={(e) => setConfig((c) => ({ ...c, chatId: e.target.value }))}
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
            <CheckCircle className="w-4 h-4" /> Mensaje enviado correctamente a Telegram
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
            <AlertCircle className="w-4 h-4" /> Error al enviar. Verifica el Token y Chat ID.
          </div>
        )}
      </div>

      {/* Enviar ahora */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-1">Enviar alertas ahora</h2>
        <p className="text-sm text-gray-500 mb-4">
          Manda un resumen de todas las alertas activas a Telegram de inmediato.
        </p>
        <button
          onClick={handleSendNow}
          disabled={status === 'sending'}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          <Send className="w-4 h-4" />
          {status === 'sending' ? 'Enviando...' : 'Enviar alertas a Telegram'}
        </button>
      </div>

      {/* Info alertas automáticas */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-700 mb-1">Alertas automáticas — cada día a las 8 AM</p>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>Cambio de aceite vencido o próximo (menos de 2,000 km)</li>
          <li>Licencia de chofer vencida o próxima a vencer (30 días)</li>
          <li>Póliza de seguro vencida o próxima a vencer (30 días)</li>
          <li>Pago de tarjeta de crédito en los próximos 5 días</li>
        </ul>
      </div>
    </div>
  );
}
