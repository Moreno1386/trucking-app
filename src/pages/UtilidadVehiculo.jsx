import { useState } from 'react';
import { TrendingUp, Plus, Edit, X } from 'lucide-react';
import useFleetStore from '../store/useFleetStore';
import { formatCurrency, formatDate } from '../utils/helpers';

const parseMonto = (v) => parseFloat(String(v).replace(/,/g, '')) || 0;

const calcGastos = (v) =>
  parseMonto(v.diesel) +
  parseMonto(v.casetas_efectivo) +
  parseMonto(v.casetas_televia) +
  parseMonto(v.otros_gastos) +
  parseMonto(v.pago_operador);

const calcUtilidad = (v) => parseMonto(v.costo_servicio) - calcGastos(v);

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

const emptyForm = {
  aseguradora: '',
  numero_poliza: '',
  tipo_cobertura: 'Amplia',
  fecha_inicio: '',
  fecha_vencimiento: '',
  prima_anual: '',
  suma_asegurada: '',
  estado: 'activo',
  notas: '',
};

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function UtilidadVehiculo() {
  const { viajesAdmin, trucks, insurances, addInsurance, updateInsurance } = useFleetStore();
  const [selectedUnidad, setSelectedUnidad] = useState('');
  const [modalPlaca, setModalPlaca] = useState(null);
  const [editInsurance, setEditInsurance] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth()); // 0-11, mes actual por defecto

  const año = new Date().getFullYear();

  // Filtrar viajes por mes seleccionado
  const viajesFiltrados = viajesAdmin.filter((v) => {
    if (!v.fecha) return false;
    const d = new Date(v.fecha);
    return d.getFullYear() === año && d.getMonth() === selectedMes;
  });

  // Agrupar por unidad directamente desde viajesAdmin
  const unidadesMap = {};
  viajesFiltrados.forEach((v) => {
    const key = (v.unidad || '').trim().toUpperCase();
    if (!key) return;
    if (!unidadesMap[key]) {
      unidadesMap[key] = { unidad: key, viajes: [], costoServicio: 0, totalGastos: 0, utilidad: 0 };
    }
    unidadesMap[key].viajes.push(v);
    unidadesMap[key].costoServicio += parseMonto(v.costo_servicio);
    unidadesMap[key].totalGastos += calcGastos(v);
    unidadesMap[key].utilidad += calcUtilidad(v);
  });

  // Buscar truck e insurance por placa
  const getTruckByPlaca = (placa) =>
    trucks.find((t) => (t.placa || '').trim().toUpperCase() === placa) || null;

  const getInsuranceByPlaca = (placa) => {
    const truck = getTruckByPlaca(placa);
    if (!truck) return null;
    return insurances.find((i) => i.camion_id === truck.id && i.estado === 'activo') || null;
  };

  const getPrimaAnual = (placa) => {
    const ins = getInsuranceByPlaca(placa);
    return ins ? (parseFloat(ins.prima_anual) || 0) : 0;
  };

  const resumen = Object.values(unidadesMap).sort((a, b) =>
    a.unidad.localeCompare(b.unidad)
  ).map((r) => ({
    ...r,
    primaAnual: getPrimaAnual(r.unidad),
    utilidadNeta: r.utilidad - getPrimaAnual(r.unidad),
  }));

  const totales = resumen.reduce(
    (acc, r) => ({
      count: acc.count + r.viajes.length,
      costoServicio: acc.costoServicio + r.costoServicio,
      totalGastos: acc.totalGastos + r.totalGastos,
      utilidad: acc.utilidad + r.utilidad,
      primaAnual: acc.primaAnual + r.primaAnual,
      utilidadNeta: acc.utilidadNeta + r.utilidadNeta,
    }),
    { count: 0, costoServicio: 0, totalGastos: 0, utilidad: 0, primaAnual: 0, utilidadNeta: 0 }
  );

  const detalle = selectedUnidad ? resumen.find((r) => r.unidad === selectedUnidad) : null;

  // Abrir modal para agregar
  const openAdd = (placa) => {
    setModalPlaca(placa);
    setEditInsurance(null);
    setForm(emptyForm);
  };

  // Abrir modal para editar
  const openEdit = (placa) => {
    const ins = getInsuranceByPlaca(placa);
    setModalPlaca(placa);
    setEditInsurance(ins);
    setForm({
      aseguradora: ins.aseguradora || '',
      numero_poliza: ins.numero_poliza || '',
      tipo_cobertura: ins.tipo_cobertura || 'Amplia',
      fecha_inicio: ins.fecha_inicio || '',
      fecha_vencimiento: ins.fecha_vencimiento || '',
      prima_anual: ins.prima_anual || '',
      suma_asegurada: ins.suma_asegurada || '',
      estado: ins.estado || 'activo',
      notas: ins.notas || '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const truck = getTruckByPlaca(modalPlaca);
    const data = {
      ...form,
      camion_id: truck ? truck.id : '',
      prima_anual: parseFloat(String(form.prima_anual).replace(/,/g, '')) || 0,
      suma_asegurada: parseFloat(String(form.suma_asegurada).replace(/,/g, '')) || 0,
    };
    if (editInsurance) {
      updateInsurance(editInsurance.id, data);
    } else {
      addInsurance(data);
    }
    setModalPlaca(null);
    setEditInsurance(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Utilidad por Vehículo</h1>
        <p className="text-gray-500 text-sm">Ingresos, gastos y utilidad neta — {MESES[selectedMes]} {año}</p>
      </div>

      {/* Tabla resumen */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-red-600" />
          <h2 className="font-semibold text-gray-800">Resumen General</h2>
          <span className="ml-auto text-xs text-gray-400">{resumen.length} unidades · {totales.count} viajes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Unidad</th>
                <th className="px-5 py-3 text-center">Viajes</th>
                <th className="px-5 py-3 text-right">Costo Serv.</th>
                <th className="px-5 py-3 text-right">Total Gastos</th>
                <th className="px-5 py-3 text-right">Utilidad</th>
                <th className="px-5 py-3 text-center">Póliza de Seguro</th>
                <th className="px-5 py-3 text-right">Utilidad Neta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resumen.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    No hay viajes registrados en Administrativo
                  </td>
                </tr>
              ) : (
                resumen.map((r) => (
                  <tr key={r.unidad} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-gray-900 font-mono">{r.unidad}</td>
                    <td className="px-5 py-3 text-center text-gray-600">{r.viajes.length}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{formatCurrency(r.costoServicio)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-red-600">{formatCurrency(r.totalGastos)}</td>
                    <td className={`px-5 py-3 text-right font-bold ${r.utilidad >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {formatCurrency(r.utilidad)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {r.primaAnual > 0 ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-semibold text-red-600">{formatCurrency(r.primaAnual)}</span>
                          <button
                            onClick={() => openEdit(r.unidad)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar póliza"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openAdd(r.unidad)}
                          className="flex items-center gap-1 mx-auto text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg px-2 py-1 transition-colors"
                          title="Agregar póliza"
                        >
                          <Plus className="w-3.5 h-3.5" /> Agregar
                        </button>
                      )}
                    </td>
                    <td className={`px-5 py-3 text-right font-bold ${r.utilidadNeta >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {formatCurrency(r.utilidadNeta)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {resumen.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td className="px-5 py-3 font-bold text-gray-800">Total General</td>
                  <td className="px-5 py-3 text-center font-bold text-gray-800">{totales.count}</td>
                  <td className="px-5 py-3 text-right font-bold text-gray-800">{formatCurrency(totales.costoServicio)}</td>
                  <td className="px-5 py-3 text-right font-bold text-red-600">{formatCurrency(totales.totalGastos)}</td>
                  <td className={`px-5 py-3 text-right font-bold text-base ${totales.utilidad >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {formatCurrency(totales.utilidad)}
                  </td>
                  <td className="px-5 py-3 text-center font-bold text-red-600">{formatCurrency(totales.primaAnual)}</td>
                  <td className={`px-5 py-3 text-right font-bold text-base ${totales.utilidadNeta >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {formatCurrency(totales.utilidadNeta)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Detalle por unidad */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Detalle por Vehículo</h2>
        <div className="max-w-sm">
          <label className="block text-xs text-gray-500 mb-1">Seleccionar unidad</label>
          <select
            value={selectedUnidad}
            onChange={(e) => setSelectedUnidad(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">— Elige una unidad —</option>
            {resumen.map((r) => (
              <option key={r.unidad} value={r.unidad}>
                {r.unidad} — {r.viajes.length} viaje{r.viajes.length !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        {detalle && (
          <>
            <div className="flex flex-wrap gap-4 py-2 border-b border-gray-100">
              <div className="bg-gray-50 rounded-lg px-4 py-2 text-center">
                <div className="text-xs text-gray-500">Viajes</div>
                <div className="font-bold text-gray-800">{detalle.viajes.length}</div>
              </div>
              <div className="bg-gray-50 rounded-lg px-4 py-2 text-center">
                <div className="text-xs text-gray-500">Costo Serv.</div>
                <div className="font-bold text-gray-700">{formatCurrency(detalle.costoServicio)}</div>
              </div>
              <div className="bg-red-50 rounded-lg px-4 py-2 text-center">
                <div className="text-xs text-gray-500">Total Gastos</div>
                <div className="font-bold text-red-600">{formatCurrency(detalle.totalGastos)}</div>
              </div>
              <div className={`rounded-lg px-4 py-2 text-center ${detalle.utilidad >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="text-xs text-gray-500">Utilidad</div>
                <div className={`font-bold ${detalle.utilidad >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {formatCurrency(detalle.utilidad)}
                </div>
              </div>
              <div className="bg-red-50 rounded-lg px-4 py-2 text-center">
                <div className="text-xs text-gray-500">Póliza de Seguro</div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-red-600">
                    {detalle.primaAnual > 0 ? formatCurrency(detalle.primaAnual) : '—'}
                  </span>
                  {detalle.primaAnual > 0 ? (
                    <button onClick={() => openEdit(detalle.unidad)} className="p-0.5 text-blue-600 hover:bg-blue-100 rounded" title="Editar póliza">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button onClick={() => openAdd(detalle.unidad)} className="p-0.5 text-blue-600 hover:bg-blue-100 rounded" title="Agregar póliza">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className={`rounded-lg px-4 py-2 text-center ${detalle.utilidadNeta >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="text-xs text-gray-500">Utilidad Neta</div>
                <div className={`font-bold ${detalle.utilidadNeta >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {formatCurrency(detalle.utilidadNeta)}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Destino</th>
                    <th className="px-4 py-3 text-left">Operador</th>
                    <th className="px-4 py-3 text-right">Costo Serv.</th>
                    <th className="px-4 py-3 text-right">Gastos</th>
                    <th className="px-4 py-3 text-right">Utilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detalle.viajes.map((v) => {
                    const util = calcUtilidad(v);
                    return (
                      <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600">{formatDate(v.fecha)}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{v.destino || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{v.operador || '—'}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(parseMonto(v.costo_servicio))}</td>
                        <td className="px-4 py-3 text-right text-red-600">{formatCurrency(calcGastos(v))}</td>
                        <td className={`px-4 py-3 text-right font-bold ${util >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                          {formatCurrency(util)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 font-bold text-gray-800">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(detalle.costoServicio)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(detalle.totalGastos)}</td>
                    <td className={`px-4 py-3 text-right font-bold text-base ${detalle.utilidad >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {formatCurrency(detalle.utilidad)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Barra de meses */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {MESES.map((mes, i) => (
            <button
              key={mes}
              onClick={() => { setSelectedMes(i); setSelectedUnidad(''); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedMes === i
                  ? 'bg-red-700 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {mes}
            </button>
          ))}
        </div>
      </div>

      {/* Modal agregar / editar póliza */}
      {modalPlaca !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {editInsurance ? 'Editar' : 'Agregar'} Póliza — <span className="font-mono text-red-700">{modalPlaca}</span>
              </h2>
              <button onClick={() => setModalPlaca(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Aseguradora *</label>
                  <input name="aseguradora" type="text" value={form.aseguradora} onChange={handleChange} required className={inp} placeholder="Ej. GNP, AXA, Qualitas..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Número de Póliza *</label>
                  <input name="numero_poliza" type="text" value={form.numero_poliza} onChange={handleChange} required className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Prima Anual (MXN)</label>
                  <input name="prima_anual" type="text" value={form.prima_anual} onChange={handleChange} className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Suma Asegurada (MXN)</label>
                  <input name="suma_asegurada" type="text" value={form.suma_asegurada} onChange={handleChange} className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Cobertura</label>
                  <input name="tipo_cobertura" type="text" value={form.tipo_cobertura} onChange={handleChange} className={inp} placeholder="Amplia, RC, etc." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                  <select name="estado" value={form.estado} onChange={handleChange} className={inp}>
                    <option value="activo">Activo</option>
                    <option value="vencido">Vencido</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Inicio</label>
                  <input name="fecha_inicio" type="date" value={form.fecha_inicio} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Vencimiento</label>
                  <input name="fecha_vencimiento" type="date" value={form.fecha_vencimiento} onChange={handleChange} className={inp} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                  <textarea name="notas" value={form.notas} onChange={handleChange} rows={2} className={inp} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setModalPlaca(null)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-medium">
                  {editInsurance ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
