import { useEffect, useMemo, useState } from 'react'
import { Html } from '@react-three/drei'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { statuses } from './fleet'

export function Box({ p = [0,0,0], s = [1,1,1], c = '#eee', ...props }) {
  return <mesh position={p} castShadow receiveShadow {...props}><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={0.72}/></mesh>
}
export function Sign({ text, p, w = 1, h = 0.25, bg = '#fafaf5', color = '#252a30', rotation = [0,0,0] }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width=768; canvas.height=128
    const ctx=canvas.getContext('2d'); ctx.fillStyle=bg; ctx.fillRect(0,0,768,128)
    ctx.fillStyle=color; ctx.font='bold 82px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(text,384,69,735)
    const texture=new CanvasTexture(canvas); texture.colorSpace=SRGBColorSpace; return texture
  }, [text,bg,color])
  useEffect(()=>()=>texture.dispose(),[texture])
  return <mesh position={p} rotation={rotation}><planeGeometry args={[w,h]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>
}
function Wheel({ p, r=0.48 }) {
  return <group position={p} rotation={[0,0,Math.PI/2]}>
    <mesh castShadow><cylinderGeometry args={[r,r,.32,12]}/><meshStandardMaterial color="#242b32" roughness={.95}/></mesh>
    {[-.17,.17].map(y=><mesh key={y} position={[0,y,0]}><cylinderGeometry args={[r*.55,r*.55,.04,10]}/><meshStandardMaterial color="#adb6bc" metalness={.6} roughness={.4}/></mesh>)}
  </group>
}
function Wheels({ zs, width, r }) { return zs.flatMap(z=>[-1,1].map(side=><Wheel key={`${z}-${side}`} p={[side*width/2,r+.04,z]} r={r}/>)) }
function Cargo({ w,l,z,y=2.65,h=2.3 }) {
  return <group>
    <Box p={[0,y,z]} s={[w,h,l]} c="#e6e7e2"/>
    <Box p={[0,y+h/2+.04,z]} s={[w+.1,.08,l+.08]} c="#f8f8f2"/>
    {[-1,1].map(side=><group key={side}>
      <Box p={[side*(w/2+.012),y-h/2+.24,z]} s={[.035,.13,l]} c="#b91c1c"/>
      {Array.from({length:12},(_,i)=><Box key={i} p={[side*(w/2+.013),y,z-l/2+.2+i*(l-.4)/11]} s={[.03,h-.2,.04]} c="#cbd0ce"/>)}
      <Sign text="CHAIRES TRUCKING" p={[side*(w/2+.045),y+.13,z]} w={l*.72} h={.42} color="#991b1b" bg="#e6e7e2" rotation={[0,side*Math.PI/2,0]}/>
    </group>)}
    <Box p={[0,y,z-l/2-.02]} s={[.04,h,.03]} c="#a6b0b2"/>
  </group>
}
function Cab({ w=2.3,z=3,y=1.9,h=2.1,l=1.8,c,hood=false,variant }) {
  const front=z+l/2
  return <>
    <Box p={[0,y,z]} s={[w,h,l]} c={c}/>
    <Box p={[0,y+h/2+.02,z]} s={[w+.06,.13,l+.13]} c={c}/>
    <Box p={[0,y+.44,front+.025]} s={[w-.3,.66,.04]} c="#314c5e"/>
    <Box p={[0,y+.44,front+.05]} s={[.06,.66,.02]} c="#51636c"/>
    {[-1,1].map(side=><group key={side}>
      <Box p={[side*(w/2+.02),y+.43,z+.05]} s={[.035,.63,l*.64]} c="#314c5e"/>
      <Box p={[side*(w/2+.02),y-.28,z]} s={[.04,.18,l-.1]} c={c==='#b91c1c'?'#eee':'#b91c1c'}/>
      <Box p={[side*(w/2+.24),y+.25,z+.55]} s={[.22,.4,.16]} c="#38444c"/>
      <Box p={[side*(w/2+.04),.84,z+.15]} s={[.25,.2,l-.25]} c="#929fa8"/>
    </group>)}
    {hood && <Box p={[0,1.43,front+.65]} s={[w*.83,.95,1.3]} c={c} rotation={variant==='peterbilt'?[0,0,0]:[-.06,0,0]}/>}
    <Box p={[0,hood?1.35:y-.45,front+(hood?1.33:.04)]} s={[variant==='peterbilt'?.85:1.1,hood?.74:.4,.06]} c="#3b444d"/>
    {[-.2,0,.2].map(yy=><Box key={yy} p={[0,(hood?1.35:y-.45)+yy,front+(hood?1.37:.08)]} s={[variant==='peterbilt'?.8:1.04,.035,.025]} c="#bbc3c7"/>)}
    <Box p={[0,.73,front+(hood?1.42:.12)]} s={[w+.08,.22,.15]} c="#b2bdc5"/>
    {[-1,1].map(side=><Box key={side} p={[side*w*.35,1.25,front+(hood?1.34:.07)]} s={[.36,.2,.06]} c="#fff1c5"/>)}
  </>
}
function Truck({ vehicle:v }) {
  const tractor=v.kind==='tractor', light=v.kind==='light', cabover=light||v.variant==='constellation'
  const w=light?1.9:2.35, cabZ=tractor?3.4:light?2.1:3, l=tractor?7:light?3.8:5
  const front=cabZ+.9+(cabover?.12:1.42)
  return <>
    <Box p={[0,.8,0]} s={[w*.8,.28,tractor?11:light?5.8:8.5]} c="#404b54"/>
    <Cargo w={w+.1} l={l} z={tractor?-3.5:light?-.65:-.9} y={light?2.05:2.65} h={light?1.95:2.3}/>
    <Cab w={w} z={cabZ} y={light?1.5:1.9} h={light?1.85:2.1} l={1.8} c={v.color} hood={!cabover} variant={v.variant}/>
    {tractor&&<>
      <Box p={[0,2.2,cabZ-1.6]} s={[w+.1,3,1.7]} c={v.color}/>
      <Box p={[0,3.15,cabZ-.75]} s={[w,.44,1.2]} rotation={[-.22,0,0]} c={v.color}/>
      {[-1,1].map(side=><group key={side}>
        <Box p={[side*(w/2+.06),2.8,cabZ-1.6]} s={[.025,.45,.6]} c="#344e60"/>
        <mesh position={[side*1.08,.97,cabZ-1.1]} rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[.24,.24,1.2,10]}/><meshStandardMaterial color="#a7b3bb" metalness={.65} roughness={.4}/></mesh>
        {v.variant==='peterbilt'&&<Box p={[side*1.27,2.4,cabZ-1]} s={[.13,3.3,.13]} c="#a4b4bc"/>}
      </group>)}
      {v.variant==='t680'&&<Box p={[0,3.67,cabZ-1.7]} s={[2.2,.15,1.4]} c="#e2e4df"/>}
      {v.variant==='cascadia'&&<Box p={[0,3.72,cabZ-1.4]} s={[2.1,.2,1.8]} rotation={[-.08,0,0]} c={v.color}/>}
    </>}
    <Wheels width={w} r={light?.4:.52} zs={tractor?[cabZ+1.05,cabZ-1.1,cabZ-2.25,-5.3,-6.35]:light?[cabZ+.1,-1.8]:[cabZ+(cabover?.2:1),-1.8,-3]}/>
    <Sign text={v.plate} p={[0,.75,front+.12]} w={.85} h={.18}/>
    <Sign text={v.unit} p={[0,light?1.45:1.95,front+(cabover?.01:-.03)]} w={.4} h={.17} color="#b91c1c"/>
    <Sign text={v.plate} p={[0,1.24,(tractor?-3.5:light?-.65:-.9)-l/2-.04]} rotation={[0,Math.PI,0]} w={.85} h={.18}/>
  </>
}
function Van({ vehicle:v }) {
  const tall=v.variant==='sprinter', l=tall?6:4.9, h=tall?2.4:1.8, w=tall?2.05:1.95
  return <>
    <Box p={[0,h/2+.63,0]} s={[w,h,l]} c={v.color}/>
    <Box p={[0,h+.67,-.2]} s={[w-.04,.14,l-.4]} c={v.color}/>
    <Box p={[0,1.82,l/2-.1]} s={[w-.23,.78,.04]} rotation={[-.19,0,0]} c="#365366"/>
    <Box p={[0,.93,l/2+.05]} s={[w*.55,.38,.1]} c="#3c4751"/>
    <Box p={[0,.66,l/2+.07]} s={[w+.05,.21,.17]} c="#53616b"/>
    {[-1,1].map(side=><group key={side}>
      <Box p={[side*(w/2+.025),1.84,l/2-.7]} s={[.04,.64,1.12]} c="#365366"/>
      {!tall&&<Box p={[side*(w/2+.025),1.8,-.9]} s={[.04,.56,1.9]} c="#365366"/>}
      <Box p={[side*(w/2+.026),1.08,0]} s={[.04,.15,l-.35]} c="#b91c1c"/>
      <Box p={[side*(w/2+.026),1.55,-.4]} s={[.04,1.4,.03]} c="#a6b1b3"/>
      <Box p={[side*(w/2+.18),1.68,l/2-.4]} s={[.2,.28,.14]} c="#394953"/>
      <Box p={[side*w*.34,1.17,l/2+.03]} s={[.36,.23,.06]} c="#fff2cd"/>
      <Sign text="CHAIRES" p={[side*(w/2+.055),tall?1.8:1.36,-.75]} w={1.5} h={.28} color="#991b1b" rotation={[0,side*Math.PI/2,0]}/>
    </group>)}
    <Wheels width={w} r={.38} zs={[l/2-1,-l/2+1]}/>
    <Sign text={v.plate} p={[0,.68,l/2+.165]} w={.85} h={.19}/>
    <Sign text={v.unit} p={[0,1.37,l/2+.025]} w={.35} h={.18} color="#991b1b"/>
    <Sign text={v.plate} p={[0,.95,-l/2-.025]} w={.85} h={.19} rotation={[0,Math.PI,0]}/>
  </>
}
function Pickup({ vehicle:v }) {
  return <>
    <Box p={[0,.75,0]} s={[1.85,.38,5.1]} c="#414d57"/>
    <Box p={[0,1.3,.55]} s={[1.94,1.5,2.25]} c={v.color}/>
    <Box p={[0,2.07,.35]} s={[1.9,.12,2]} c={v.color}/>
    <Box p={[0,1.74,1.69]} s={[1.62,.57,.04]} rotation={[-.16,0,0]} c="#345267"/>
    <Box p={[0,1.12,2.05]} s={[1.92,.63,.85]} c={v.color}/>
    <Box p={[0,.98,2.5]} s={[1.1,.43,.07]} c="#34444f"/>
    <Box p={[0,.69,2.55]} s={[2,.2,.14]} c="#a8b4ba"/>
    <Box p={[0,.98,-1.65]} s={[1.92,.12,1.85]} c="#333f49"/>
    {[-1,1].map(side=><group key={side}>
      <Box p={[side*.89,1.26,-1.65]} s={[.18,.65,1.9]} c={v.color}/>
      <Box p={[side*.98,1.76,.6]} s={[.035,.52,1.65]} c="#345267"/>
      <Box p={[side*.99,1.76,.35]} s={[.04,.58,.09]} c={v.color}/>
      <Box p={[side*1.09,1.6,1.15]} s={[.2,.25,.15]} c="#34444f"/>
      <Box p={[side*.69,1.21,2.5]} s={[.46,.23,.08]} c="#fff2cd"/>
    </group>)}
    <Box p={[0,1.26,-2.58]} s={[1.92,.65,.16]} c={v.color}/>
    <Wheels width={1.95} r={.41} zs={[1.63,-1.65]}/>
    <Sign text={v.plate} p={[0,.68,2.64]} w={.85} h={.19}/>
    <Sign text="PILOTO" p={[0,1.22,2.55]} w={.65} h={.16} color="#991b1b"/>
    <Sign text={v.plate} p={[0,1.3,-2.675]} w={.85} h={.19} rotation={[0,Math.PI,0]}/>
  </>
}

export default function Vehicle({ vehicle:v, selected, onSelect, labels=true }) {
  const [hover,setHover]=useState(false)
  const height=v.kind==='tractor'?4:v.kind==='medium'?4:v.kind==='light'?3.1:v.variant==='sprinter'?3.3:2.7
  const front=v.kind==='tractor'?3.5:v.kind==='medium'?3:2
  const halfLength=v.kind==='tractor'?6.8:v.kind==='medium'?4.8:v.kind==='light'?3.4:3.2
  useEffect(()=>{ if(hover)document.body.style.cursor='pointer'; return()=>{document.body.style.cursor=''} },[hover])
  return <group position={v.position} name={`vehicle-${v.unit}`}>
    <group onClick={e=>{e.stopPropagation();onSelect(v.id)}} onPointerOver={e=>{e.stopPropagation();setHover(true)}} onPointerOut={()=>setHover(false)}>
      <mesh position={[0,.025,-.3]} rotation={[-Math.PI/2,0,0]} scale={[1.8,halfLength,1]}><circleGeometry args={[1,32]}/><meshBasicMaterial color={statuses[v.oil.status].color} transparent opacity={selected?.25:.14} depthWrite={false}/></mesh>
      <mesh position={[0,.03,-.3]} rotation={[-Math.PI/2,0,0]} scale={[1.8,halfLength,1]}><ringGeometry args={[.97,1,32]}/><meshBasicMaterial color={statuses[v.oil.status].color}/></mesh>
      {selected&&<mesh position={[0,.04,front]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.8,1.86,40]}/><meshBasicMaterial color="#b91c1c"/></mesh>}
      {v.kind==='van'?<Van vehicle={v}/>:v.kind==='pickup'?<Pickup vehicle={v}/>:<Truck vehicle={v}/>}
    </group>
    {labels&&<Html position={[0,height+.55,front]} center zIndexRange={[15,5]}><button data-stack={Number(v.bay.split('-')[1])%2?'up':'down'} className={`v2-vehicle-tag ${selected?'is-selected':''}`} onClick={()=>onSelect(v.id)} aria-label={`Ver unidad ${v.unit}, placa ${v.plate}`} aria-pressed={selected}><span><i style={{background:statuses[v.oil.status].color}}/><b>{v.unit}</b>{v.issues.length>0&&<em title="Revisar kilometraje">!</em>}</span><small>{v.plate}</small></button></Html>}
  </group>
}
