import { Truck, Users, Route, Bell, AlertTriangle, CheckCircle, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useFleetStore from '../store/useFleetStore';
import { statusClass, statusLabel, formatNumber, getOilStatus } from '../utils/helpers';

function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { trucks, drivers } = useFleetStore();
  const getAlerts = useFleetStore((s) => s.getAlerts);
  const navigate = useNavigate();

  const stats = {
    totalCamiones: trucks.length,
    disponibles: trucks.filter((t) => t.estado === 'disponible').length,
    enViaje: trucks.filter((t) => t.estado === 'en_viaje').length,
    choferesActivos: drivers.filter((d) => d.estado === 'activo').length,
  };

  const alerts = getAlerts();
  const highAlerts = alerts.filter((a) => a.severity === 'high');
  const mediumAlerts = alerts.filter((a) => a.severity === 'medium');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Bienvenido al Sistema de Gestión de Flota</p>
        </div>
        <button
          onClick={() => navigate('/fleet')}
          className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Bell className="w-4 h-4" />
          Enviar Alertas
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Truck} label="Total Camiones" value={stats.totalCamiones} color="bg-red-600" />
        <KpiCard icon={CheckCircle} label="Camiones Disponibles" value={stats.disponibles} color="bg-green-500" />
        <KpiCard icon={Route} label="En Viaje" value={stats.enViaje} color="bg-blue-500" />
        <KpiCard icon={Users} label="Choferes Activos" value={stats.choferesActivos} color="bg-purple-500" />
      </div>

      {/* Main + Alerts panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mis Camiones */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Mis Camiones</h2>
            <button
              onClick={() => navigate('/fleet')}
              className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Camión
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {trucks.map((truck) => {
              const oil = getOilStatus(truck);
              return (
                <div
                  key={truck.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate('/fleet')}
                >
                  <div className="bg-red-100 rounded-lg p-2.5">
                    <Truck className="w-5 h-5 text-red-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">
                        Unidad {truck.numero_unidad}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {truck.marca} {truck.modelo} {truck.anio}
                      </span>
                      {truck.placa && (
                        <span className="text-gray-400 text-xs">• {truck.placa}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatNumber(truck.kilometraje_actual)} km
                      </span>
                      {oil.status === 'vencido' && (
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          Aceite vencido
                        </span>
                      )}
                      {oil.status === 'proximo' && (
                        <span className="text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">
                          Aceite próximo
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusClass(truck.estado)}`}>
                      {statusLabel[truck.estado] || truck.estado}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              );
            })}
            {trucks.length === 0 && (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">
                No hay camiones registrados
              </div>
            )}
          </div>
        </div>

        {/* Alertas Prioritarias */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h2 className="font-semibold text-gray-900">Alertas Prioritarias</h2>
            {alerts.length > 0 && (
              <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {alerts.length}
              </span>
            )}
          </div>
          <div className="p-4 space-y-3 overflow-y-auto max-h-[420px]">
            {alerts.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Sin alertas activas</p>
              </div>
            )}
            {highAlerts.map((alert) => (
              <div key={alert.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-800">{alert.titulo}</p>
                    <p className="text-xs text-red-700 mt-0.5">{alert.mensaje}</p>
                    <p className="text-xs text-red-500 mt-0.5">{alert.detalle}</p>
                  </div>
                </div>
              </div>
            ))}
            {mediumAlerts.map((alert) => (
              <div key={alert.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-yellow-800">{alert.titulo}</p>
                    <p className="text-xs text-yellow-700 mt-0.5">{alert.mensaje}</p>
                    <p className="text-xs text-yellow-600 mt-0.5">{alert.detalle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
