import { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  History, Search, Upload, Download, X, ArrowUp, ArrowDown, FileSpreadsheet,
  AlertTriangle, CheckCircle2, Loader2, RotateCcw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Histórico de viajes (2020 en adelante). Solo consulta; vive en su propia tabla
// `viajes_historicos`. Desde 2026 además LEE (solo lectura) los viajes de Administrativo.

const TABLE = 'viajes_historicos';

const COLS = [
  { k: 'fecha', label: 'Fecha', type: 'date', w: 104 },
  { k: 'destino', label: 'Destino', type: 'text', w: 250 },
  { k: 'operador', label: 'Operador', type: 'text', w: 150 },
  { k: 'unidad', label: 'Unidad', type: 'text', w: 96 },
  { k: 'costo_real', label: 'Costo Real', type: 'money' },
  { k: 'costo_servicio', label: 'Costo Servicio', type: 'money' },
  { k: 'diesel', label: 'Diésel', type: 'money' },
  { k: 'casetas_efectivo', label: 'Casetas Efectivo', type: 'money' },
  { k: 'casetas_televia', label: 'Casetas TeleVía', type: 'money' },
  { k: 'casetas_iave', label: 'Casetas IAVE', type: 'money' },
  { k: 'otros_gastos', label: 'Otros Gastos', type: 'money' },
  { k: 'prestamos', label: 'Préstamos', type: 'money' },
  { k: 'abonos', label: 'Abonos', type: 'money' },
  { k: 'pago_operador', label: 'Pago Operador', type: 'money' },
  { k: 'utilidad', label: 'Utilidad', type: 'money' },
  { k: 'utilidad_real', label: 'Utilidad Real', type: 'money' },
];
const ALWAYS = ['fecha', 'destino', 'operador', 'unidad', 'costo_servicio', 'utilidad'];
const MONEY_KEYS = COLS.filter((c) => c.type === 'money').map((c) => c.k);

// Encabezados del Excel → columna de la tabla
const HEADER_MAP = {
  'FECHA': 'fecha',
  'DESTINO': 'destino',
  'OPERADOR': 'operador',
  'UNIDAD': 'unidad',
  'COSTO REAL': 'costo_real',
  'COSTO SERV': 'costo_servicio',
  'COSTO SERVICIO': 'costo_servicio',
  'COSTO DEL SERVICIO': 'costo_servicio',
  'GASOLINA': 'diesel',
  'DIESEL': 'diesel',
  'CASETAS EFECTIVO': 'casetas_efectivo',
  'CASETAS TELEVIA': 'casetas_televia',
  'CASETAS IAVE': 'casetas_iave',
  'OTROS GASTOS': 'otros_gastos',
  'PRESTAMOS': 'prestamos',
  'ABONOS': 'abonos',
  'PAGO OPERADOR': 'pago_operador',
  'UTILIDAD': 'utilidad',
  'UTILIDAD REAL': 'utilidad_real',
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const moneyFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
const fmtMoney = (v) => (v === null || v === undefined || v === '' ? '' : moneyFmt.format(Number(v)));
const isIso = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const fmtFecha = (s) => (isIso(s) ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : s || '');
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
const sumOf = (rows, k) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
const dupKey = (r) => [r.fecha, norm(r.destino), norm(r.operador), norm(r.unidad), Number(r.costo_servicio) || 0].join('|');

function toNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
  const n = parseFloat(String(v).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function toFecha(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' && v > 30000 && v < 80000) {
    const d = XLSX.SSF.parse_date_code(v);
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  if (isIso(s)) return s;
  return s; // se guarda tal como venía
}

// Lee un libro de Excel y devuelve los viajes de la primera hoja que tenga FECHA + DESTINO
function parseWorkbook(buf) {
  const wb = XLSX.read(buf, { type: 'array' });
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: null });
    const hIdx = rows.slice(0, 10).findIndex((r) => r && r.some((c) => norm(c) === 'FECHA') && r.some((c) => norm(c) === 'DESTINO'));
    if (hIdx === -1) continue;
    const header = rows[hIdx];
    const map = {};
    const ignored = [];
    header.forEach((h, i) => {
      if (h === null || norm(h) === '') return;
      const k = HEADER_MAP[norm(h)];
      if (k && !Object.values(map).includes(k)) map[i] = k;
      else ignored.push(String(h).trim());
    });
    const viajes = [];
    for (const r of rows.slice(hIdx + 1)) {
      if (!r) continue;
      const di = Object.keys(map).find((i) => map[i] === 'destino');
      const destino = r[di];
      if (typeof destino !== 'string' || !destino.trim()) continue;
      const v = {};
      for (const [i, k] of Object.entries(map)) {
        const raw = r[i];
        if (k === 'fecha') v.fecha = toFecha(raw);
        else if (MONEY_KEYS.includes(k)) v[k] = toNumber(raw);
        else v[k] = raw === null ? null : String(raw).trim() || null;
      }
      viajes.push(v);
    }
    return { sheet: name, mapped: Object.values(map), ignored, viajes };
  }
  return null;
}

async function fetchAll() {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('anio', { ascending: true })
      .order('orden', { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

// Viajes de 2026 en adelante: se leen EN VIVO de Administrativo (viajes_admin), solo lectura.
// No se copian ni se guardan en viajes_historicos. Si algún año ya fue importado a
// viajes_historicos, ese año se muestra desde ahí y se ignora la versión en vivo (sin duplicar).
const LIVE_DESDE = 2026;
// Pestañas que siempre se muestran aunque todavía no tengan viajes
const EXTRA_YEARS = [new Date().getFullYear(), 2027];
const LIVE_FIELDS = ['costo_servicio', 'diesel', 'casetas_efectivo', 'casetas_televia', 'otros_gastos', 'pago_operador'];

async function fetchAdminVivo(aniosImportados) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('viajes_admin')
      .select('id, fecha, destino, operador, unidad, costo_servicio, diesel, casetas_efectivo, casetas_televia, otros_gastos, pago_operador')
      .gte('fecha', `${LIVE_DESDE}-01-01`)
      .order('fecha', { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) break;
  }
  const orden = {};
  return out
    .filter((v) => isIso(v.fecha) && !aniosImportados.has(Number(v.fecha.slice(0, 4))))
    .map((v) => {
      const anio = Number(v.fecha.slice(0, 4));
      orden[anio] = (orden[anio] || 0) + 1;
      const r = { id: `admin-${v.id}`, anio, orden: orden[anio], fecha: v.fecha, destino: v.destino, operador: v.operador, unidad: v.unidad, vivo: true };
      LIVE_FIELDS.forEach((k) => { r[k] = toNumber(v[k]); });
      r.utilidad = Math.round(((r.costo_servicio || 0) - (r.diesel || 0) - (r.casetas_efectivo || 0)
        - (r.casetas_televia || 0) - (r.otros_gastos || 0) - (r.pago_operador || 0)) * 100) / 100;
      return r;
    });
}

const fieldCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

export default function HistoricoViajes() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [year, setYear] = useState(null); // null = Todos
  const [q, setQ] = useState('');
  const [operador, setOperador] = useState('');
  const [unidad, setUnidad] = useState('');
  const [mes, setMes] = useState('');
  const [sort, setSort] = useState({ k: null, dir: 1 });
  const [selected, setSelected] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const hist = await fetchAll();
      const vivo = await fetchAdminVivo(new Set(hist.map((r) => r.anio)));
      const data = [...hist, ...vivo];
      setRows(data);
      setYear((y) => {
        const ys = [...new Set([...data.map((r) => r.anio), ...EXTRA_YEARS])].sort();
        if (y !== null && ys.includes(y)) return y;
        const cy = new Date().getFullYear();
        return ys.includes(cy) ? cy : ys[ys.length - 1] ?? null;
      });
    } catch (e) {
      setError(e.message || 'No se pudo cargar el histórico');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const years = useMemo(() => [...new Set([...rows.map((r) => r.anio), ...EXTRA_YEARS])].sort(), [rows]);
  const esVivo = year !== null && year >= LIVE_DESDE && !rows.some((r) => r.anio === year && !r.vivo);
  const yearRows = useMemo(() => (year === null ? rows : rows.filter((r) => r.anio === year)), [rows, year]);
  const operadores = useMemo(() => [...new Set(yearRows.map((r) => r.operador).filter(Boolean))].sort(), [yearRows]);
  const unidades = useMemo(() => [...new Set(yearRows.map((r) => r.unidad).filter(Boolean))].sort(), [yearRows]);

  const filtered = useMemo(() => {
    const nq = norm(q);
    let list = yearRows.filter((r) => {
      if (operador && r.operador !== operador) return false;
      if (unidad && r.unidad !== unidad) return false;
      if (mes !== '' && !(isIso(r.fecha) && Number(r.fecha.slice(5, 7)) === Number(mes) + 1)) return false;
      if (nq && !norm(`${r.destino} ${r.operador} ${r.unidad} ${fmtFecha(r.fecha)}`).includes(nq)) return false;
      return true;
    });
    if (sort.k) {
      const col = COLS.find((c) => c.k === sort.k);
      list = [...list].sort((a, b) => {
        const va = a[sort.k], vb = b[sort.k];
        if (va === null || va === undefined || va === '') return 1;
        if (vb === null || vb === undefined || vb === '') return -1;
        if (col.type === 'money') return (Number(va) - Number(vb)) * sort.dir;
        return String(va).localeCompare(String(vb), 'es') * sort.dir;
      });
    }
    return list;
  }, [yearRows, q, operador, unidad, mes, sort]);

  const visibleCols = useMemo(
    () => COLS.filter((c) => ALWAYS.includes(c.k) || yearRows.some((r) => r[c.k] !== null && r[c.k] !== undefined && r[c.k] !== '')),
    [yearRows],
  );

  const totals = useMemo(() => Object.fromEntries(MONEY_KEYS.map((k) => [k, sumOf(filtered, k)])), [filtered]);
  const hasFilters = q || operador || unidad || mes !== '';

  const clearFilters = () => { setQ(''); setOperador(''); setUnidad(''); setMes(''); };
  const changeYear = (y) => { setYear(y); clearFilters(); setSort({ k: null, dir: 1 }); setSelected(null); };
  const toggleSort = (k) => setSort((s) => (s.k !== k ? { k, dir: 1 } : s.dir === 1 ? { k, dir: -1 } : { k: null, dir: 1 }));

  const exportExcel = () => {
    const data = filtered.map((r) => Object.fromEntries(visibleCols.map((c) => [
      c.label,
      c.type === 'money' ? (r[c.k] === null ? '' : Number(r[c.k])) : c.type === 'date' ? fmtFecha(r.fecha) : r[c.k] ?? '',
    ])));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = visibleCols.map((c) => ({ wch: c.k === 'destino' ? 34 : c.type === 'money' ? 15 : 14 }));
    const wb = XLSX.utils.book_new();
    const name = year === null ? 'Todos' : String(year);
    XLSX.utils.book_append_sheet(wb, ws, `Viajes ${name}`);
    XLSX.writeFile(wb, `historico_viajes_${name}.xlsx`);
  };

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-4">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-700 text-white flex items-center justify-center shadow-sm">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Histórico de Viajes</h1>
            <p className="text-xs text-gray-500">
              {years.length ? `${years[0]} – ${years[years.length - 1]}` : 'Sin viajes cargados'} · Solo consulta
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium shadow-sm"
          >
            <Upload className="w-4 h-4" /> Importar Excel
          </button>
          <button
            onClick={exportExcel}
            disabled={!filtered.length}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-sm"
          >
            <Download className="w-4 h-4" /> Descargar Excel
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Viajes" value={filtered.length.toLocaleString('es-MX')} />
        <Stat label="Costo del servicio" value={fmtMoney(totals.costo_servicio)} />
        <Stat label="Pago a operadores" value={fmtMoney(totals.pago_operador)} />
        <Stat label="Utilidad" value={fmtMoney(totals.utilidad)} accent={totals.utilidad < 0 ? 'text-red-600' : 'text-green-700'} />
      </div>

      {esVivo && (
        <div className="text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          Viajes {year}: se muestran en vivo desde <b>Administrativo</b>. Lo que se capture ahí aparece aquí solo.
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar destino, operador, unidad o fecha…"
            className={`${fieldCls} w-full pl-9`}
          />
        </div>
        <select value={operador} onChange={(e) => setOperador(e.target.value)} className={fieldCls}>
          <option value="">Todos los operadores</option>
          {operadores.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={unidad} onChange={(e) => setUnidad(e.target.value)} className={fieldCls}>
          <option value="">Todas las unidades</option>
          {unidades.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <select value={mes} onChange={(e) => setMes(e.target.value)} className={fieldCls}>
          <option value="">Todos los meses</option>
          {MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-700 hover:text-red-800 px-2 py-2">
            <RotateCcw className="w-3.5 h-3.5" /> Limpiar
          </button>
        )}
      </div>

      {/* Hoja tipo Excel */}
      <div
        className="flex flex-col bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden"
        style={{ height: 'max(420px, calc(100vh - 300px))' }}
      >
        <div className="flex-1 overflow-auto relative">
          {loading ? (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando viajes…
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-red-600 text-sm gap-2 p-6 text-center">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          ) : !rows.length ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm gap-2 p-6 text-center">
              <FileSpreadsheet className="w-8 h-8 text-gray-300" />
              Todavía no hay viajes. Usa “Importar Excel” para cargarlos.
            </div>
          ) : (
            <table className="border-separate border-spacing-0 text-[13px] tabular-nums w-max min-w-full">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 z-30 bg-gray-100 border-b-2 border-r border-gray-300 w-12 min-w-[3rem]" />
                  {visibleCols.map((c) => (
                    <th
                      key={c.k}
                      onClick={() => toggleSort(c.k)}
                      style={{ minWidth: c.w || 128 }}
                      className={`sticky top-0 z-20 bg-red-700 text-white font-semibold px-3 py-2.5 border-b-2 border-r border-red-800 cursor-pointer select-none whitespace-nowrap hover:bg-red-800 ${c.type === 'money' ? 'text-right' : 'text-left'}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        {sort.k === c.k && (sort.dir === 1 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const isSel = selected === r.id;
                  return (
                    <tr key={r.id} onClick={() => setSelected(isSel ? null : r.id)} className="group cursor-default">
                      <td className={`sticky left-0 z-10 text-center text-[11px] border-b border-r border-gray-300 px-1 ${isSel ? 'bg-red-100 text-red-800 font-semibold' : 'bg-gray-100 text-gray-500'}`}>
                        {i + 1}
                      </td>
                      {visibleCols.map((c) => {
                        const v = r[c.k];
                        const neg = c.type === 'money' && Number(v) < 0;
                        const badDate = c.type === 'date' && v && !isIso(v);
                        return (
                          <td
                            key={c.k}
                            title={c.k === 'destino' ? v || '' : badDate ? 'Fecha tal como venía en el Excel original' : undefined}
                            className={`px-3 py-1.5 border-b border-r border-gray-200 whitespace-nowrap ${
                              isSel ? 'bg-red-50' : i % 2 ? 'bg-gray-50/70 group-hover:bg-amber-50' : 'bg-white group-hover:bg-amber-50'
                            } ${c.type === 'money' ? 'text-right' : 'text-left'} ${neg ? 'text-red-600' : 'text-gray-800'} ${
                              c.k === 'destino' ? 'max-w-[320px] truncate' : ''
                            } ${c.k === 'costo_servicio' || c.k === 'utilidad' ? 'font-semibold' : ''}`}
                          >
                            {c.type === 'money' ? fmtMoney(v) : c.type === 'date' ? (
                              badDate ? <span className="text-amber-700 bg-amber-100 rounded px-1">{v}</span> : fmtFecha(v)
                            ) : v || ''}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan={visibleCols.length + 1} className="text-center text-gray-500 py-10">
                      Ningún viaje coincide con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr>
                    <td className="sticky bottom-0 left-0 z-30 bg-gray-200 border-t-2 border-r border-gray-400" />
                    {visibleCols.map((c, idx) => (
                      <td
                        key={c.k}
                        className={`sticky bottom-0 z-20 bg-gray-200 border-t-2 border-r border-gray-400 px-3 py-2 font-bold whitespace-nowrap ${
                          c.type === 'money' ? 'text-right' : 'text-left'
                        } ${c.type === 'money' && totals[c.k] < 0 ? 'text-red-700' : 'text-gray-900'}`}
                      >
                        {idx === 0 ? 'TOTAL' : idx === 1 ? `${filtered.length.toLocaleString('es-MX')} viajes` : c.type === 'money' ? fmtMoney(totals[c.k]) : ''}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>

        {/* Pestañas de año, como las hojas de Excel */}
        {years.length > 0 && (
          <div className="flex items-end gap-0.5 bg-gray-100 border-t border-gray-300 px-2 pt-1 overflow-x-auto">
            {years.map((y) => (
              <SheetTab key={y} active={year === y} onClick={() => changeYear(y)}>Viajes {y}</SheetTab>
            ))}
            <SheetTab active={year === null} onClick={() => changeYear(null)}>Todos</SheetTab>
          </div>
        )}
      </div>

      {showImport && (
        <ImportModal
          existing={rows}
          onClose={() => setShowImport(false)}
          onDone={async (y) => { setShowImport(false); await load(); if (y) changeYear(y); }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, accent = 'text-gray-900' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}

function SheetTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-sm whitespace-nowrap rounded-t-md border border-b-0 transition-colors ${
        active
          ? 'bg-white text-red-700 font-semibold border-gray-300 shadow-[0_-2px_0_0_#b91c1c_inset]'
          : 'bg-transparent text-gray-600 border-transparent hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function ImportModal({ existing, onClose, onDone }) {
  const fileRef = useRef(null);
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState('');
  const [anio, setAnio] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr('');
    setParsed(null);
    setFileName(f.name);
    try {
      const res = parseWorkbook(await f.arrayBuffer());
      if (!res || !res.viajes.length) {
        setErr('No encontré una hoja con columnas FECHA y DESTINO en este archivo.');
        return;
      }
      const counts = {};
      res.viajes.forEach((v) => { if (isIso(v.fecha)) counts[v.fecha.slice(0, 4)] = (counts[v.fecha.slice(0, 4)] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      setAnio(top ? top[0] : String(new Date().getFullYear()));
      setParsed(res);
    } catch (ex) {
      setErr(`No se pudo leer el archivo: ${ex.message}`);
    }
  };

  const existingKeys = useMemo(() => new Set(existing.map(dupKey)), [existing]);
  const nuevos = useMemo(() => (parsed ? parsed.viajes.filter((v) => !existingKeys.has(dupKey(v))) : []), [parsed, existingKeys]);
  const repetidos = parsed ? parsed.viajes.length - nuevos.length : 0;
  const malas = nuevos.filter((v) => v.fecha && !isIso(v.fecha)).length;

  const save = async () => {
    setSaving(true);
    setErr('');
    const y = Number(anio);
    const base = existing.filter((r) => r.anio === y).reduce((m, r) => Math.max(m, r.orden || 0), 0);
    const payload = nuevos.map((v, i) => ({ ...v, anio: y, orden: base + i + 1, fuente: fileName }));
    for (let i = 0; i < payload.length; i += 500) {
      const { error } = await supabase.from(TABLE).insert(payload.slice(i, i + 500));
      if (error) {
        setErr(`Se guardaron ${i} de ${payload.length}. Error: ${error.message}`);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    onDone(y);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-700" /> Importar viajes desde Excel
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <p className="text-gray-600">
            El archivo debe tener columnas como <b>FECHA, DESTINO, OPERADOR, UNIDAD, COSTO SERV</b>…
            Los viajes se <b>agregan</b> al histórico; no se borra nada. Los que ya existan se saltan.
          </p>

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 hover:border-red-400 rounded-lg py-6 text-gray-600 flex flex-col items-center gap-2"
          >
            <Upload className="w-6 h-6" />
            {fileName || 'Elegir archivo .xlsx'}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFile} />

          {err && (
            <div className="flex gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {err}
            </div>
          )}

          {parsed && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Info label="Hoja leída" value={parsed.sheet.trim()} />
                <Info label="Viajes en el archivo" value={parsed.viajes.length} />
                <Info label="Nuevos a agregar" value={nuevos.length} strong />
                <Info label="Ya existían (se saltan)" value={repetidos} />
                <Info label="Costo del servicio (nuevos)" value={fmtMoney(sumOf(nuevos, 'costo_servicio'))} />
                <div>
                  <div className="text-[11px] uppercase text-gray-500">Guardar en la pestaña</div>
                  <input
                    type="number"
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    className="mt-0.5 w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                  />
                </div>
              </div>
              {malas > 0 && (
                <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  {malas} viaje(s) traen la fecha mal escrita; se guardan tal como vienen (se verán en amarillo).
                </p>
              )}
              {parsed.ignored.length > 0 && (
                <p className="text-gray-500">Columnas que no se usan: {parsed.ignored.join(', ')}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-200">Cancelar</button>
          <button
            onClick={save}
            disabled={!parsed || !nuevos.length || !Number(anio) || saving}
            className="flex items-center gap-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? 'Guardando…' : `Agregar ${nuevos.length || ''} viajes`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, strong }) {
  return (
    <div>
      <div className="text-[11px] uppercase text-gray-500">{label}</div>
      <div className={`${strong ? 'font-bold text-red-700' : 'font-medium text-gray-900'}`}>{value}</div>
    </div>
  );
}
