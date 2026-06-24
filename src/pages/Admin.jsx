import { useState, useMemo } from 'react';
import { Truck, Plus, Edit, Trash2, X, Eye, Download, Search, Filter, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import useFleetStore from '../store/useFleetStore';
import { formatCurrency, formatDate } from '../utils/helpers';

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent';

function parseMonto(val) {
  return parseFloat(String(val).replace(/,/g, '')) || 0;
}

// ── Sección Viajes Admin ──────────────────────────────────────
const emptyViaje = {
  fecha: '',
  destino: '',
  operador: '',
  unidad: '',
  costo_servicio: '',
  diesel: '',
  casetas_efectivo: '',
  casetas_televia: '',
  otros_gastos: '',
  pago_operador: '',
};

function calcUtilidad(v) {
  return (
    parseMonto(v.costo_servicio) -
    parseMonto(v.diesel) -
    parseMonto(v.casetas_efectivo) -
    parseMonto(v.casetas_televia) -
    parseMonto(v.otros_gastos) -
    parseMonto(v.pago_operador)
  );
}

function ViajesAdmin() {
  const { viajesAdmin, addViajeAdmin, updateViajeAdmin, deleteViajeAdmin } = useFleetStore();
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyViaje);
  const [editingCliente, setEditingCliente] = useState(null);
  const [clienteInput, setClienteInput] = useState('');

  // ── Filtros ──────────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState('');
  const [filtroOperador, setFiltroOperador] = useState('');
  const [filtroUnidad, setFiltroUnidad] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  // Opciones únicas para selects
  const operadores = useMemo(() =>
    [...new Set(viajesAdmin.map((v) => v.operador).filter(Boolean))].sort(),
    [viajesAdmin]
  );
  const unidades = useMemo(() =>
    [...new Set(viajesAdmin.map((v) => (v.unidad || '').trim().toUpperCase()).filter(Boolean))].sort(),
    [viajesAdmin]
  );

  // Viajes filtrados
  const viajesFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return viajesAdmin.filter((v) => {
      const matchBusqueda = !q || (
        (v.destino || '').toLowerCase().includes(q) ||
        (v.operador || '').toLowerCase().includes(q) ||
        (v.unidad || '').toLowerCase().includes(q)
      );
      const matchOperador = !filtroOperador || v.operador === filtroOperador;
      const matchUnidad = !filtroUnidad || (v.unidad || '').trim().toUpperCase() === filtroUnidad;
      const matchDesde = !filtroDesde || v.fecha >= filtroDesde;
      const matchHasta = !filtroHasta || v.fecha <= filtroHasta;
      return matchBusqueda && matchOperador && matchUnidad && matchDesde && matchHasta;
    });
  }, [viajesAdmin, busqueda, filtroOperador, filtroUnidad, filtroDesde, filtroHasta]);

  const hayFiltros = busqueda || filtroOperador || filtroUnidad || filtroDesde || filtroHasta;

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroOperador('');
    setFiltroUnidad('');
    setFiltroDesde('');
    setFiltroHasta('');
  };

  // Totales sobre los viajes filtrados
  const totalCosto = viajesFiltrados.reduce((s, v) => s + parseMonto(v.costo_servicio), 0);
  const totalGastos = viajesFiltrados.reduce((s, v) =>
    s + parseMonto(v.diesel) + parseMonto(v.casetas_efectivo) + parseMonto(v.casetas_televia) + parseMonto(v.otros_gastos) + parseMonto(v.pago_operador), 0);
  const totalUtilidad = viajesFiltrados.reduce((s, v) => s + calcUtilidad(v), 0);

  const openAdd = () => { setEditItem(null); setForm(emptyViaje); setShowModal(true); };
  const openEdit = (v) => { setEditItem(v); setForm({ ...v }); setShowModal(true); };
  const handleDelete = (v) => {
    if (window.confirm(`¿Eliminar viaje a "${v.destino}"?`)) deleteViajeAdmin(v.id);
  };

  const exportarExcel = () => {
    const filas = viajesFiltrados.map((v) => ({
      'Fecha': formatDate(v.fecha),
      'Destino': v.destino,
      'Operador': v.operador,
      'Unidad': v.unidad,
      'Costo Servicio': parseMonto(v.costo_servicio),
      'Diesel': parseMonto(v.diesel),
      'Casetas Efectivo': parseMonto(v.casetas_efectivo),
      'Casetas Televia': parseMonto(v.casetas_televia),
      'Otros Gastos': parseMonto(v.otros_gastos),
      'Pago Operador': parseMonto(v.pago_operador),
      'Utilidad': calcUtilidad(v),
    }));
    const hoja = XLSX.utils.json_to_sheet(filas);
    hoja['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 10 },
      { wch: 15 }, { wch: 12 }, { wch: 16 }, { wch: 15 },
      { wch: 13 }, { wch: 14 }, { wch: 12 },
    ];
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Viajes');
    XLSX.writeFile(libro, 'registro_viajes.xlsx');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      costo_servicio: parseMonto(form.costo_servicio),
      diesel: parseMonto(form.diesel),
      casetas_efectivo: parseMonto(form.casetas_efectivo),
      casetas_televia: parseMonto(form.casetas_televia),
      otros_gastos: parseMonto(form.otros_gastos),
      pago_operador: parseMonto(form.pago_operador),
    };
    if (editItem) updateViajeAdmin(editItem.id, data);
    else addViajeAdmin(data);
    setShowModal(false); setEditItem(null);
  };

  const utilidadPreview = calcUtilidad(form);
  const thClass = 'px-2 py-2 text-left text-xs font-semibold text-white whitespace-nowrap';
  const tdClass = 'px-2 py-2 text-sm text-gray-800 whitespace-nowrap';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-orange-600" />
          <h2 className="text-sm font-bold text-gray-900">Registro de Viajes</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{viajesAdmin.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportarExcel} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg text-xs font-medium transition-colors">
            <Download className="w-3.5 h-3.5" /> Exportar Excel
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-2.5 py-1 rounded-lg text-xs font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" /> Nuevo Viaje
          </button>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex-shrink-0 px-3 py-2 border-b bg-gray-50 space-y-2">
        {/* Búsqueda + filtros en una sola fila */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por destino, operador o unidad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select value={filtroOperador} onChange={(e) => setFiltroOperador(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-700">
            <option value="">Todos los operadores</option>
            {operadores.map((op) => <option key={op} value={op}>{op}</option>)}
          </select>
          <select value={filtroUnidad} onChange={(e) => setFiltroUnidad(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-700">
            <option value="">Todas las unidades</option>
            {unidades.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-700" title="Desde" />
          <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-700" title="Hasta" />
          {hayFiltros && (
            <button onClick={limpiarFiltros} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors whitespace-nowrap">
              <XCircle className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>
        <div className="text-xs text-gray-400">
          {hayFiltros
            ? <span>Mostrando <span className="font-semibold text-orange-600">{viajesFiltrados.length}</span> de <span className="font-semibold">{viajesAdmin.length}</span> viajes</span>
            : <span>Total: <span className="font-semibold">{viajesAdmin.length}</span> viajes</span>
          }
        </div>
      </div>

      {/* Totales (sobre viajes filtrados) */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-4 px-5 py-2 border-b bg-orange-50">
        <div className="text-center">
          <div className="text-xs text-orange-500">Total Costo Servicio</div>
          <div className="text-base font-bold text-orange-700">{formatCurrency(totalCosto)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-red-500">Total Gastos</div>
          <div className="text-base font-bold text-red-700">{formatCurrency(totalGastos)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-green-500">Total Utilidad</div>
          <div className="text-base font-bold text-green-700">{formatCurrency(totalUtilidad)}</div>
        </div>
      </div>

      {/* Tabla */}
      {viajesFiltrados.length === 0 ? (
        <div className="flex-1 py-16 text-center space-y-2">
          <Filter className="w-8 h-8 text-gray-300 mx-auto" />
          <div className="text-gray-400 text-sm">
            {viajesAdmin.length === 0 ? 'No hay viajes registrados' : 'No se encontraron viajes con esos filtros'}
          </div>
          {hayFiltros && (
            <button onClick={limpiarFiltros} className="text-xs text-orange-600 hover:underline">Limpiar filtros</button>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="table-fixed" style={{width:'100%', minWidth:'1300px'}}>
            <colgroup>
              <col style={{width:'90px'}} />
              <col style={{width:'120px'}} />
              <col style={{width:'120px'}} />
              <col style={{width:'130px'}} />
              <col style={{width:'80px'}} />
              <col style={{width:'105px'}} />
              <col style={{width:'95px'}} />
              <col style={{width:'115px'}} />
              <col style={{width:'115px'}} />
              <col style={{width:'100px'}} />
              <col style={{width:'110px'}} />
              <col style={{width:'105px'}} />
              <col style={{width:'75px'}} />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="bg-orange-700">
                <th className={thClass}>Fecha</th>
                <th className={thClass}>Destino</th>
                <th className={thClass}>Clientes</th>
                <th className={thClass}>Operador</th>
                <th className={thClass}>Unidad</th>
                <th className={`${thClass} text-right`}>Costo Serv.</th>
                <th className={`${thClass} text-right`}>Diesel</th>
                <th className={`${thClass} text-right`}>Casetas Efectivo</th>
                <th className={`${thClass} text-right`}>Casetas Televia</th>
                <th className={`${thClass} text-right`}>Otros Gastos</th>
                <th className={`${thClass} text-right`}>Pago Operador</th>
                <th className={`${thClass} text-right`}>Utilidad</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {viajesFiltrados.map((v) => {
                const util = calcUtilidad(v);
                return (
                  <tr key={v.id} className="hover:bg-orange-50 transition-colors">
                    <td className={tdClass}>{formatDate(v.fecha)}</td>
                    <td className={`${tdClass} font-medium`}>{v.destino}</td>
                    <td className={tdClass}>
                      {editingCliente === v.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={clienteInput}
                            onChange={(e) => setClienteInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateViajeAdmin(v.id, { cliente: clienteInput });
                                setEditingCliente(null);
                              }
                              if (e.key === 'Escape') { e.target.dataset.cancel = '1'; setEditingCliente(null); }
                            }}
                            onBlur={(e) => {
                              // Guardar automáticamente al salir del campo (clic fuera, Tab, etc.),
                              // salvo que se haya cancelado con Escape o el botón ✕.
                              if (e.target.dataset.cancel === '1') return;
                              updateViajeAdmin(v.id, { cliente: clienteInput });
                              setEditingCliente(null);
                            }}
                            className="border border-orange-300 rounded px-2 py-1 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-orange-400"
                          />
                          <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { updateViajeAdmin(v.id, { cliente: clienteInput }); setEditingCliente(null); }}
                            className="text-green-600 hover:text-green-800 text-xs font-bold"
                          >✓</button>
                          <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setEditingCliente(null)}
                            className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                          >✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className={`truncate max-w-[80px] ${v.cliente ? 'text-gray-800' : 'text-gray-300'}`}>{v.cliente || '—'}</span>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button
                              onClick={() => { setEditingCliente(v.id); setClienteInput(v.cliente || ''); }}
                              className="text-blue-400 hover:text-blue-600"
                              title="Editar cliente"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {v.cliente && (
                              <button
                                onClick={() => updateViajeAdmin(v.id, { cliente: '' })}
                                className="text-red-400 hover:text-red-600"
                                title="Eliminar cliente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className={tdClass}>{v.operador}</td>
                    <td className={tdClass}><span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{v.unidad}</span></td>
                    <td className={`${tdClass} text-right`}>{formatCurrency(v.costo_servicio)}</td>
                    <td className={`${tdClass} text-right text-red-600`}>{formatCurrency(v.diesel)}</td>
                    <td className={`${tdClass} text-right`}>{parseMonto(v.casetas_efectivo) > 0 ? formatCurrency(v.casetas_efectivo) : <span className="text-gray-300">—</span>}</td>
                    <td className={`${tdClass} text-right`}>{parseMonto(v.casetas_televia) > 0 ? formatCurrency(v.casetas_televia) : <span className="text-gray-300">—</span>}</td>
                    <td className={`${tdClass} text-right`}>{parseMonto(v.otros_gastos) > 0 ? formatCurrency(v.otros_gastos) : <span className="text-gray-300">—</span>}</td>
                    <td className={`${tdClass} text-right`}>{formatCurrency(v.pago_operador)}</td>
                    <td className={`${tdClass} text-right font-bold text-green-700`}>{formatCurrency(util)}</td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setShowDetail(v)} className="text-gray-400 hover:text-gray-600"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(v)} className="text-blue-500 hover:text-blue-700"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(v)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Ver */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-900">Viaje — {showDetail.destino}</h3>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4 text-sm">
              {[
                ['Fecha', formatDate(showDetail.fecha)],
                ['Destino', showDetail.destino],
                ['Operador', showDetail.operador],
                ['Unidad', showDetail.unidad],
                ['Costo Servicio', formatCurrency(showDetail.costo_servicio)],
                ['Diesel', formatCurrency(showDetail.diesel)],
                ['Casetas Efectivo', formatCurrency(showDetail.casetas_efectivo)],
                ['Casetas Televia', formatCurrency(showDetail.casetas_televia)],
                ['Otros Gastos', formatCurrency(showDetail.otros_gastos)],
                ['Pago Operador', formatCurrency(showDetail.pago_operador)],
              ].map(([k, val]) => (
                <div key={k}>
                  <div className="text-xs text-gray-400">{k}</div>
                  <div className="font-medium text-gray-900">{val}</div>
                </div>
              ))}
              <div className="col-span-2 bg-green-50 rounded-lg p-3 border border-green-100">
                <div className="text-xs text-green-600">Utilidad</div>
                <div className="text-xl font-bold text-green-700">{formatCurrency(calcUtilidad(showDetail))}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-900">{editItem ? 'Editar Viaje' : 'Nuevo Viaje'}</h3>
              <button onClick={() => { setShowModal(false); setEditItem(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Fecha *</label><input name="fecha" type="date" value={form.fecha} onChange={handleChange} required className={inp} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Destino *</label><input name="destino" type="text" value={form.destino} onChange={handleChange} required className={inp} placeholder="Ej. HIROTEC" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Operador</label><input name="operador" type="text" value={form.operador} onChange={handleChange} className={inp} placeholder="Ej. LUIS REYES" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Unidad</label><input name="unidad" type="text" value={form.unidad} onChange={handleChange} className={inp} placeholder="Ej. 58AZ3W" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Costo Servicio ($)</label><input name="costo_servicio" type="text" value={form.costo_servicio} onChange={handleChange} className={inp} placeholder="0.00" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Diesel ($)</label><input name="diesel" type="text" value={form.diesel} onChange={handleChange} className={inp} placeholder="0.00" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Casetas Efectivo ($)</label><input name="casetas_efectivo" type="text" value={form.casetas_efectivo} onChange={handleChange} className={inp} placeholder="0.00" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Casetas Televia ($)</label><input name="casetas_televia" type="text" value={form.casetas_televia} onChange={handleChange} className={inp} placeholder="0.00" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Otros Gastos ($)</label><input name="otros_gastos" type="text" value={form.otros_gastos} onChange={handleChange} className={inp} placeholder="0.00" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Pago Operador ($)</label><input name="pago_operador" type="text" value={form.pago_operador} onChange={handleChange} className={inp} placeholder="0.00" /></div>
              </div>
              <div className={`rounded-lg p-4 border ${utilidadPreview >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="text-xs text-gray-500 mb-1">Utilidad calculada automáticamente</div>
                <div className={`text-2xl font-bold ${utilidadPreview >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(utilidadPreview)}</div>
                <div className="text-xs text-gray-400 mt-1">Costo Serv. − Diesel − Casetas Ef. − Casetas Tele. − Otros Gastos − Pago Operador</div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => { setShowModal(false); setEditItem(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium">{editItem ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function Admin() {
  const { viajesAdmin } = useFleetStore();

  const totalUtilidadViajes = viajesAdmin.reduce((s, v) => s + calcUtilidad(v), 0);

  return (
    <div className="h-full flex flex-col gap-2 px-6 pt-4 pb-4 overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Administrativo</h1>
          <p className="text-gray-400 text-xs">Control de viajes y utilidades</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-orange-50 border border-orange-100 rounded-lg px-4 py-1.5 text-center">
            <div className="text-xs text-orange-500">Viajes Registrados</div>
            <div className="text-base font-bold text-orange-700">{viajesAdmin.length}</div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-1.5 text-center">
            <div className="text-xs text-green-500">Utilidad Total Viajes</div>
            <div className="text-base font-bold text-green-700">{formatCurrency(totalUtilidadViajes)}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ViajesAdmin />
      </div>
    </div>
  );
}
