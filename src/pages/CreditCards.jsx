import { useState } from 'react';
import { CreditCard, Plus, Edit, Trash2, X, Phone, MessageCircle, Info, Eye } from 'lucide-react';
import useFleetStore from '../store/useFleetStore';
import { formatCurrency, maskCard } from '../utils/helpers';

const emptyForm = {
  titular: '',
  numero_tarjeta: '',
  banco: '',
  tipo: '',
  limite: '',
  saldo: '',
  dia_corte: '',
  dia_pago: '',
  notas: '',
};

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

const WHATSAPP_NUMBER = '5213321786677';

function CardVisual({ card }) {
  const available = (parseFloat(card.limite) || 0) - (parseFloat(card.saldo) || 0);
  const usedPct = card.limite > 0 ? Math.min((card.saldo / card.limite) * 100, 100) : 0;
  const barColor = usedPct > 80 ? 'bg-red-500' : usedPct > 50 ? 'bg-yellow-400' : 'bg-green-500';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Card gradient top */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-5 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-xs text-gray-300 mb-0.5">{card.banco}</div>
            <div className="text-xs font-semibold text-gray-200 uppercase tracking-wider">{card.tipo}</div>
          </div>
          <CreditCard className="w-8 h-8 text-gray-400" />
        </div>
        <div className="font-mono text-lg tracking-widest mb-4">{maskCard(card.numero_tarjeta)}</div>
        <div className="text-sm font-medium text-gray-200">{card.titular}</div>
      </div>

      {/* Info */}
      <div className="p-5 space-y-4">
        {/* Amounts */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xs text-gray-400">Límite</div>
            <div className="font-bold text-gray-900 text-sm">{formatCurrency(card.limite)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Saldo</div>
            <div className="font-bold text-red-600 text-sm">{formatCurrency(card.saldo)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Disponible</div>
            <div className="font-bold text-green-600 text-sm">{formatCurrency(available)}</div>
          </div>
        </div>

        {/* Usage bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Uso del crédito</span>
            <span>{usedPct.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${usedPct}%` }} />
          </div>
        </div>

        {/* Cut/pay days */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-0.5">Día de Corte</div>
            <div className="text-2xl font-bold text-gray-900">{card.dia_corte || '—'}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-0.5">Día de Pago</div>
            <div className="text-2xl font-bold text-red-700">{card.dia_pago || '—'}</div>
          </div>
        </div>

        {/* Note */}
        {card.notas && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-xs text-yellow-800">
            {card.notas}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreditCards() {
  const { creditCards, addCreditCard, updateCreditCard, deleteCreditCard } = useFleetStore();
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c) => { setEditItem(c); setForm({ ...c }); setShowModal(true); };
  const handleDelete = (c) => {
    if (window.confirm(`¿Eliminar tarjeta ${maskCard(c.numero_tarjeta)}?`)) deleteCreditCard(c.id);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      limite: parseFloat(form.limite) || 0,
      saldo: parseFloat(form.saldo) || 0,
      dia_corte: parseInt(form.dia_corte) || 0,
      dia_pago: parseInt(form.dia_pago) || 0,
    };
    if (editItem) updateCreditCard(editItem.id, data);
    else addCreditCard(data);
    setShowModal(false); setEditItem(null);
  };

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tarjetas de Crédito</h1>
          <p className="text-gray-500 text-sm">{creditCards.length} tarjetas registradas</p>
        </div>
        <div className="flex gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
          <button onClick={openAdd} className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Nueva Tarjeta
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <span className="font-semibold">Notificaciones automáticas:</span> Las alertas de corte y pago se envían vía WhatsApp al número{' '}
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-mono font-bold hover:underline">
            +{WHATSAPP_NUMBER}
          </a>
        </div>
      </div>

      {/* Cards grid */}
      {creditCards.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay tarjetas registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {creditCards.map((card) => (
            <div key={card.id} className="space-y-3">
              <CardVisual card={card} />
              {/* Action buttons below card */}
              <div className="flex gap-2">
                <button onClick={() => setShowDetail(card)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg py-2 transition-colors shadow-sm">
                  <Eye className="w-3.5 h-3.5" /> Ver
                </button>
                <button onClick={() => openEdit(card)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg py-2 transition-colors shadow-sm">
                  <Edit className="w-3.5 h-3.5" /> Editar
                </button>
                <button onClick={() => handleDelete(card)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg py-2 transition-colors shadow-sm">
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{showDetail.banco} — {showDetail.tipo}</h2>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 text-sm">
              {[
                ['Titular', showDetail.titular],
                ['Banco', showDetail.banco],
                ['Tipo', showDetail.tipo],
                ['No. Tarjeta', maskCard(showDetail.numero_tarjeta)],
                ['Límite', formatCurrency(showDetail.limite)],
                ['Saldo', formatCurrency(showDetail.saldo)],
                ['Disponible', formatCurrency((parseFloat(showDetail.limite) || 0) - (parseFloat(showDetail.saldo) || 0))],
                ['Día de Corte', showDetail.dia_corte || '—'],
                ['Día de Pago', showDetail.dia_pago || '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs text-gray-400">{k}</div>
                  <div className="font-medium text-gray-900">{v}</div>
                </div>
              ))}
              {showDetail.notas && (
                <div className="col-span-2">
                  <div className="text-xs text-gray-400">Notas</div>
                  <div className="text-gray-700 text-xs">{showDetail.notas}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">{editItem ? 'Editar' : 'Nueva'} Tarjeta</h2>
              <button onClick={() => { setShowModal(false); setEditItem(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Titular *</label>
                  <input name="titular" type="text" value={form.titular} onChange={handleChange} required className={inp} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Número de Tarjeta *</label>
                  <input name="numero_tarjeta" type="text" value={form.numero_tarjeta} onChange={handleChange} required maxLength={19} placeholder="1234567890123456" className={inp} />
                </div>
                {[
                  ['banco', 'Banco *', 'text', true],
                  ['tipo', 'Tipo (Platinum, Costco...)', 'text', false],
                  ['limite', 'Límite de Crédito', 'number', false],
                  ['saldo', 'Saldo Actual', 'number', false],
                  ['dia_corte', 'Día de Corte', 'number', false],
                  ['dia_pago', 'Día de Pago', 'number', false],
                ].map(([name, label, type, required]) => (
                  <div key={name}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                    <input name={name} type={type} value={form[name]} onChange={handleChange} required={required} className={inp}
                      min={type === 'number' ? 0 : undefined}
                      max={name.startsWith('dia') ? 31 : undefined}
                      step={type === 'number' && !name.startsWith('dia') ? '0.01' : undefined}
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                  <textarea name="notas" value={form.notas} onChange={handleChange} rows={3} className={inp} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); setEditItem(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-medium">{editItem ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
