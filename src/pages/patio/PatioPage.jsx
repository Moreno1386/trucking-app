import React, { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowDownToLine, ArrowUpRight, BarChart2, Bell, BookOpen, Box, Briefcase, CalendarClock, CheckCircle, ChevronRight, Clock, CreditCard, FileText, Fuel, Gauge, LayoutDashboard, Menu, Minus, Plus, RotateCcw, Route, Search, Settings, ShieldCheck, Truck, Users, Wrench, X } from 'lucide-react'
import { prepareFleet, statuses, types, fmt, sortPriority, oilText, tripImpact, csvReport } from './fleet'
import './patio.css'
const Yard=lazy(()=>import('./Yard'))

class Boundary extends Component {
  state={failed:false}
  static getDerivedStateFromError(){return {failed:true}}
  render(){return this.state.failed?<div className="v2-fallback"><Box size={32}/><b>No se pudo iniciar la vista 3D</b><p>La tabla y las fichas siguen disponibles. Activa WebGL en tu navegador para ver el patio.</p></div>:this.props.children}
}
function Badge({v}) { return <span className={`v2-badge ${v.oil.status}`}><i/>{statuses[v.oil.status].label}</span> }
function OilBar({v}) {return <div className="v2-oil-track"><span style={{width:`${Math.max(0,v.oil.pct)}%`,background:statuses[v.oil.status].color}}/></div>}
function Detail({v,onClose,tripKm}) {
  const heading=useRef()
  useEffect(()=>{heading.current?.focus({preventScroll:true})},[v.id])
  return <aside className="v2-detail" aria-label={`Ficha unidad ${v.unit}`}>
    <div className="v2-detail-heading"><span>FICHA DE UNIDAD</span><button className="v2-icon" onClick={onClose} aria-label="Cerrar ficha"><X size={19}/></button></div>
    <h2 ref={heading} tabIndex={-1}>Unidad {v.unit}</h2><p className="v2-model">{v.marca} {v.modelo} · {v.anio}</p>
    <div className="v2-plate-row"><strong>{v.plate}</strong><span>{types[v.kind]} · {v.bay}</span></div>
    <Badge v={v}/>
    {v.issues.length>0&&<div className="v2-data-warning"><AlertTriangle size={17}/><div><b>Revisar kilometraje</b><p>{v.issues.join(' ')}</p><small>El estado de aceite se conserva tal como lo calcula la app.</small></div></div>}
    <dl className="v2-specs"><div><dt>Odómetro actual</dt><dd>{fmt(v.kilometraje_actual)} km</dd></div><div><dt>Último cambio</dt><dd>{fmt(v.ultimo_cambio_aceite)} km</dd></div><div><dt>Intervalo de aceite</dt><dd>{fmt(v.oil.interval)} km</dd></div><div><dt>Último mantenimiento</dt><dd>{v.fecha_ultimo_mantenimiento?new Date(`${v.fecha_ultimo_mantenimiento}T12:00:00`).toLocaleDateString('es-MX'):'Sin fecha registrada'}</dd></div><div><dt>Capacidad de carga</dt><dd>{v.capacidad_carga>0?`${fmt(v.capacidad_carga)} kg`:'Sin registrar (0)'}</dd></div><div><dt>Estado registrado</dt><dd className="v2-available">{v.estado}</dd></div></dl>
    <div className={`v2-oil-box ${v.oil.status}`}><span><Fuel size={16}/> Próximo cambio de aceite</span><strong>{fmt(v.oil.next)} <small>km</small></strong><OilBar v={v}/><b>{oilText(v)}</b>{v.issues.length>0&&<small>Cálculo no confiable hasta confirmar los datos.</small>}</div>
    {tripKm>0&&<div className={`v2-trip-result ${tripImpact(v,tripKm).kind}`}><Route size={16}/><div><b>Viaje simulado: {fmt(tripKm)} km</b><p>{tripImpact(v,tripKm).label}</p></div></div>}
    <p className="v2-note">Registro original: {v.numero_unidad.trim()}. Ubicación y apariencia ilustrativas.</p>
  </aside>
}
function Priorities({fleet,onSelect}) {
  const items=fleet.filter(v=>v.oil.status!=='ok'||v.issues.length).sort(sortPriority)
  return <aside className="v2-priorities"><div className="v2-section-heading"><span><Bell size={17}/> Atención prioritaria</span><b>{items.length}</b></div><p className="v2-muted">Empieza por lo que necesita una decisión.</p>
    {items.map(v=><button className={`v2-priority-card ${v.issues.length?'review':v.oil.status}`} key={v.id} onClick={()=>onSelect(v.id)}><span className="v2-priority-top"><strong>Unidad {v.unit}</strong><ArrowUpRight size={16}/></span><span className="v2-priority-plate">{v.plate} · {v.marca}</span><b>{v.issues.length?'Revisar kilometraje':oilText(v)}</b><small>{v.issues.length?'El odómetro es menor al último cambio.':v.oil.status==='vencido'?'Atender el cambio de aceite.':'Programar el próximo cambio.'}</small></button>)}
    <div className="v2-rule"><ShieldCheck size={16}/><p><b>Misma regla que tu app</b><br/>Vencido ≤ 0 km · Próximo ≤ 2,000 km.</p></div>
  </aside>
}

export default function PatioPage({records:inputRecords,embedded=false}) {
  const fleet=useMemo(()=>prepareFleet(inputRecords),[inputRecords])
  const [selectedId,setSelectedId]=useState(null),[query,setQuery]=useState(''),[status,setStatus]=useState('all'),[type,setType]=useState('all'),[sort,setSort]=useState('priority')
  const [mode,setMode]=useState('3d'),[zone,setZone]=useState('all'),[reset,setReset]=useState(0),[trip,setTrip]=useState(''),[lowPower,setLowPower]=useState(false)
  const controls=useRef(), scene=useRef()
  useEffect(()=>{
    const mobile=window.matchMedia('(max-width: 760px)')
    const adapt=()=>{setZone(mobile.matches?'B':'all');setSelectedId(null)}
    adapt();mobile.addEventListener('change',adapt)
    return()=>mobile.removeEventListener('change',adapt)
  },[])
  const selected=fleet.find(v=>v.id===selectedId)
  const tripKm=trip===''?0:Number(trip), validTrip=Number.isFinite(tripKm)&&tripKm>=0&&tripKm<=100000
  const visible=useMemo(()=>fleet.filter(v=>(status==='all'||(status==='review'?v.issues.length:v.oil.status===status))&&(type==='all'||v.kind===type)&&`${v.numero_unidad} ${v.plate} ${v.marca} ${v.modelo}`.toLowerCase().includes(query.trim().toLowerCase())).sort(sort==='unit'?(a,b)=>a.unit.localeCompare(b.unit,undefined,{numeric:true}):sortPriority),[fleet,status,type,query,sort])
  const sceneVehicles=useMemo(()=>selected&&!visible.some(v=>v.id===selected.id)?[...visible,selected]:visible,[visible,selected])
  const choose=useCallback(id=>{setSelectedId(id);setZone('all')},[])
  useEffect(()=>{const key=e=>{if(e.key==='Escape')setSelectedId(null)};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[])
  const clear=()=>{setQuery('');setStatus('all');setType('all');setSelectedId(null);setZone('all');setReset(n=>n+1)}
  const exportReport=()=>{const url=URL.createObjectURL(new Blob([csvReport(fleet)],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='chaires-prioridades-aceite.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  const counts={total:fleet.length,vencido:fleet.filter(v=>v.oil.status==='vencido').length,proximo:fleet.filter(v=>v.oil.status==='proximo').length,review:fleet.filter(v=>v.issues.length).length}
  const impending=fleet.filter(v=>!v.issues.length&&v.oil.remaining>0&&v.oil.remaining-tripKm<=0)
  return <div className={`patio-v2 v2-page ${embedded?'v2-embedded':''}`}>
    <header className="v2-page-header"><div><div className="v2-eyebrow">CHAIRES TRUCKING / CONTROL DE FLOTA</div><h1>Patio 3D</h1><p>Una vista de tu flota. Las prioridades, a la vista.</p></div><button className="v2-primary" onClick={exportReport}><ArrowDownToLine size={17}/> Exportar prioridades</button></header>
    <div className="v2-source"><ShieldCheck size={14}/><span>{fleet.length} unidades · Datos de tu flota</span><span className="v2-source-end">Solo consulta</span></div>
    <section className="v2-kpis" aria-label="Resumen de flota">
      {[[Truck,'total','Unidades registradas','all','Flota completa'],[Wrench,'vencido','Aceite vencido','vencido','Atención inmediata'],[Clock,'proximo','Aceite próximo','proximo','Hasta 2,000 km restantes'],[AlertTriangle,'review','Dato por revisar','review','Verificar antes de decidir']].map(([Icon,key,label,filter,sub])=><button key={key} className={`v2-kpi ${key} ${status===filter?'active':''}`} onClick={()=>{setStatus(filter);setSelectedId(null)}} aria-pressed={status===filter}><span className="v2-kpi-icon"><Icon size={23}/></span><span><strong>{counts[key]}</strong><b>{label}</b><small>{sub}</small></span><ChevronRight size={15}/></button>)}
    </section>
    <section className="v2-filters" aria-label="Filtrar vehículos"><label className="v2-search"><Search size={17}/><input aria-label="Buscar unidad, placa o modelo" value={query} onChange={e=>{setQuery(e.target.value);setSelectedId(null)}} placeholder="Buscar unidad, placa o modelo…"/>{query&&<button onClick={()=>setQuery('')} aria-label="Limpiar búsqueda"><X size={16}/></button>}</label><select aria-label="Tipo de vehículo" value={type} onChange={e=>{setType(e.target.value);setSelectedId(null)}}><option value="all">Todos los tipos</option>{Object.entries(types).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><select aria-label="Estado de aceite" value={status} onChange={e=>{setStatus(e.target.value);setSelectedId(null)}}><option value="all">Todos los estados</option>{Object.entries(statuses).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}<option value="review">Revisar datos</option></select>{(query||type!=='all'||status!=='all')&&<button className="v2-text-button" onClick={clear}>Limpiar filtros</button>}</section>
    <section className="v2-workspace" ref={scene}>
      <div className="v2-scene-card"><div className="v2-scene-header"><div><h2><Box size={18}/> Vista de patio</h2><span>Ubicaciones ilustrativas · {sceneVehicles.filter(v=>zone==='all'||v.zone===zone).length} vehículos visibles</span></div><div className="v2-view-switch"><button onClick={()=>{setMode('3d');setSelectedId(null);setReset(n=>n+1)}} aria-pressed={mode==='3d'}>3D</button><button onClick={()=>{setMode('top');setSelectedId(null);setReset(n=>n+1)}} aria-pressed={mode==='top'}>Superior</button></div></div>
        <div className="v2-canvas"><div className="v2-canvas-caption">CHAIRES <span>PATIO PRINCIPAL</span></div><Boundary><Suspense fallback={<div className="v2-fallback"><Box size={30}/><p>Preparando tu flota…</p></div>}><Yard vehicles={sceneVehicles} selected={selected} onSelect={choose} mode={mode} zone={zone} reset={reset} controls={controls} lowPower={lowPower}/></Suspense></Boundary>
          <div className="v2-tools"><button aria-label="Acercar" onClick={()=>controls.current?.dolly(5,true)}><Plus size={19}/></button><button aria-label="Alejar" onClick={()=>controls.current?.dolly(-5,true)}><Minus size={19}/></button><button aria-label="Restablecer cámara" onClick={()=>{setSelectedId(null);setReset(n=>n+1)}}><RotateCcw size={17}/></button></div>
          <div className="v2-zone-switch">{[['all','Todo el patio'],['A','Zona A'],['B','Zona B']].map(([key,label])=><button key={key} aria-pressed={zone===key} onClick={()=>{setZone(key);setSelectedId(null)}}>{label}</button>)}</div>
          {!visible.length&&<div className="v2-scene-empty">No hay unidades con estos filtros.</div>}
        </div>
        <div className="v2-scene-footer"><div className="v2-legend">{Object.entries(statuses).map(([key,s])=><span key={key}><i style={{background:s.color}}/>{s.label}</span>)}<span><i className="v2-purple"/>! Revisar datos</span></div><label className="v2-quality"><input type="checkbox" checked={lowPower} onChange={e=>setLowPower(e.target.checked)}/>Modo ligero</label></div><div className="v2-instructions">Clic o toque: ficha · Arrastra: girar · Rueda o pellizco: zoom · Dos dedos: desplazar</div>
      </div>
      {selected?<Detail v={selected} onClose={()=>setSelectedId(null)} tripKm={validTrip?tripKm:0}/>:<Priorities fleet={fleet} onSelect={choose}/>}
    </section>
    <section className="v2-trip-planner"><span className="v2-trip-icon"><Route size={23}/></span><div><h2>Antes del próximo viaje</h2><p>Simula el recorrido total, incluida la vuelta, y anticipa el cambio de aceite.</p></div><label>Kilómetros del recorrido<div><input aria-label="Kilómetros del viaje" type="number" min="0" max="100000" step="1" value={trip} placeholder="Ej. 1,000" onChange={e=>setTrip(e.target.value)}/><span>km</span></div></label><div className="v2-trip-summary" aria-live="polite">{!validTrip?<b>Ingresa entre 0 y 100,000 km.</b>:tripKm>0?<><strong>{impending.length} {impending.length===1?'unidad llegaría':'unidades llegarían'} al cambio</strong><span>Además de {counts.vencido} ya vencida. {counts.review} requiere confirmar datos.</span></>:<><b>Proyección solo de aceite</b><span>No modifica registros ni asigna viajes.</span></>}</div></section>
    <section className="v2-table-card"><div className="v2-table-heading"><div><h2>Las unidades de tu flota <span>{visible.length}</span></h2><p>Datos originales con alertas calculadas. Selecciona una unidad para ver su ficha.</p></div><select value={sort} aria-label="Ordenar unidades" onChange={e=>setSort(e.target.value)}><option value="priority">Ordenar por prioridad</option><option value="unit">Ordenar por unidad</option></select></div>
      <p className="v2-table-hint">Desliza la tabla para ver todos los datos →</p><div className="v2-table-scroll"><table><thead><tr><th>UNIDAD / PLACA</th><th>VEHÍCULO</th><th>KILOMETRAJE</th><th>PRÓXIMO ACEITE</th><th>ESTADO DE ACEITE</th>{validTrip&&tripKm>0&&<th>AL REGRESO · {fmt(tripKm)} KM</th>}<th/></tr></thead><tbody>{visible.map(v=><tr key={v.id} className={selectedId===v.id?'selected':''}><td><button className="v2-unit-link" onClick={()=>{choose(v.id);scene.current?.scrollIntoView({behavior:'smooth',block:'start'})}} aria-label={`Localizar unidad ${v.unit}`}><b><Truck size={15}/>Unidad {v.unit}</b><small>{v.plate}</small></button><span className="v2-mobile-oil"><Badge v={v}/></span></td><td><b>{v.marca} {v.modelo}</b><small>{v.anio} · {types[v.kind]}</small><span className="v2-mobile-mileage">{fmt(v.kilometraje_actual)} km</span></td><td><b>{fmt(v.kilometraje_actual)} km</b><small>Último: {fmt(v.ultimo_cambio_aceite)} km</small></td><td><b>{fmt(v.oil.next)} km</b><small>Intervalo: {fmt(v.oil.interval)} km</small></td><td><Badge v={v}/><small className={v.issues.length?'v2-warning-text':''}>{v.issues.length?'! Revisar kilometraje':oilText(v)}</small></td>{validTrip&&tripKm>0&&<td><span className={`v2-trip-cell ${tripImpact(v,tripKm).kind}`}>{tripImpact(v,tripKm).label}</span></td>}<td><button className="v2-icon" aria-label={`Abrir ficha de ${v.unit}`} onClick={()=>{choose(v.id);scene.current?.scrollIntoView({behavior:'smooth',block:'start'})}}><ChevronRight size={17}/></button></td></tr>)}</tbody></table></div>
      {!visible.length&&<div className="v2-empty"><Search size={24}/><h3>No encontramos unidades</h3><p>Prueba otra placa o limpia los filtros.</p><button className="v2-primary" onClick={clear}>Mostrar toda la flota</button></div>}
    </section>
    <section className="v2-improvements"><div><Wrench size={18}/><b>Una lista para el taller</b><p>Exporta los kilómetros y las prioridades para preparar los próximos servicios.</p></div><div><AlertTriangle size={18}/><b>Decisiones con datos confiables</b><p>Las unidades con kilometraje inconsistente quedan señaladas para verificarlas antes de planear.</p></div><div><Route size={18}/><b>Anticipa el regreso</b><p>Simula distancias sin cambiar el estado registrado de tus vehículos.</p></div></section>
    {!embedded&&<footer className="v2-footer"><span>Chaires Trucking · Patio 3D</span><span>Datos de tu flota. Posiciones, carrocerías y colores ilustrativos.</span></footer>}
  </div>
}


