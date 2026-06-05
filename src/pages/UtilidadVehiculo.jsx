import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import useFleetStore from '../store/useFleetStore';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function UtilidadVehiculo() {
  const { trucks, trips } = useFleetStore();
  const [selectedTruck, setSelectedTruck] = useState('');

  // Resumen por vehículo: total de costo y número de viajes
  const resumen = trucks.map((truck) => {
    const viajesCamion = trips.filter((t) => t.camion_id === truck.id);
    const total = viajesCamion.reduce((sum, t) => sum + (parseFloat(t.costo) || 0), 0);
    return { truck, total, count: viajesCamion.length };
  });

  // Viajes del vehículo seleccionado
  const viajesFiltrados = selectedTruck
    ? trips.filter((t) => t.camion_id === selectedTruck)
    : [];
  const totalFiltrado = viajesFiltrados.reduce((sum, t) => sum + (parseFloat(t.costo) || 0), 0);
  const truckSeleccionado = trucks.find((t) => t.id === selectedTruck);

  const truckLabel = (t) => `Unidad ${t.numero_unidad} — ${t.marca} ${t.modelo} (${t.anio})`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Utilidad por Vehículo</h1>
        <p className="text-gray-500 text-sm">Suma de ingresos por viaje agrupados por unidad</p>
      </div>

      {/* Tabla resumen todos los vehículos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-red-600" />
          <h2 className="font-semibold text-gray-800">Resumen General</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Unidad</th>
                <th className="px-5 py-3 text-left">Vehículo</th>
                <th className="px-5 py-3 text-center">Viajes</th>
                <th className="px-5 py-3 text-right">Total Ingresos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resumen.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                    No hay vehículos registrados
                  </td>
                </tr>
              ) : (
                resumen.map(({ truck, total, count }) => (
                  <tr key={truck.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-gray-900">
                      Unidad {truck.numero_unidad}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {truck.marca} {truck.modelo} ({truck.anio})
                    </td>
                    <td className="px-5 py-3 text-center text-gray-600">{count}</td>
                    <td className="px-5 py-3 text-right font-semibold text-green-700">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {resumen.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={2} className="px-5 py-3 font-bold text-gray-800">
                    Total General
                  </td>
                  <td className="px-5 py-3 text-center font-bold text-gray-800">
                    {resumen.reduce((s, r) => s + r.count, 0)}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-green-700 text-base">
                    {formatCurrency(resumen.reduce((s, r) => s + r.total, 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Filtro por vehículo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Detalle por Vehículo</h2>
        <div className="max-w-sm">
          <label className="block text-xs text-gray-500 mb-1">Seleccionar vehículo</label>
          <select
            value={selectedTruck}
            onChange={(e) => setSelectedTruck(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">— Elige una unidad —</option>
            {trucks.map((t) => (
              <option key={t.id} value={t.id}>
                {truckLabel(t)}
              </option>
            ))}
          </select>
        </div>

        {selectedTruck && (
          <>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                {truckSeleccionado ? truckLabel(truckSeleccionado) : ''}
              </span>
              <span className="text-sm font-semibold text-gray-700">
                {viajesFiltrados.length} viaje{viajesFiltrados.length !== 1 ? 's' : ''}
              </span>
            </div>

            {viajesFiltrados.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                Esta unidad no tiene viajes registrados
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left"># Viaje</th>
                      <th className="px-4 py-3 text-left">Origen → Destino</th>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Fecha Salida</th>
                      <th className="px-4 py-3 text-left">Estado</th>
                      <th className="px-4 py-3 text-right">Ingreso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {viajesFiltrados.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{v.numero_viaje}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {v.origen || '—'} → {v.destino || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{v.cliente || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(v.fecha_salida)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            v.estado === 'completado' ? 'bg-green-100 text-green-700' :
                            v.estado === 'en_curso' ? 'bg-blue-100 text-blue-700' :
                            v.estado === 'cancelado' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {v.estado === 'completado' ? 'Completado' :
                             v.estado === 'en_curso' ? 'En curso' :
                             v.estado === 'cancelado' ? 'Cancelado' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-700">
                          {formatCurrency(parseFloat(v.costo) || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 font-bold text-gray-800">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-700 text-base">
                        {formatCurrency(totalFiltrado)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
