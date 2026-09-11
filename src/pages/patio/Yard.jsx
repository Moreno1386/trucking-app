import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import Vehicle, { Box, Sign } from './Vehicle'

function Tree({x,z}) { return <group position={[x,0,z]}><Box p={[0,.18,0]} s={[2,.36,2]} c="#a4aaa0"/><Box p={[0,.4,0]} s={[1.8,.06,1.8]} c="#7e9167"/><Box p={[0,1.5,0]} s={[.2,2.2,.2]} c="#8e7760"/><mesh position={[0,3,0]} castShadow><icosahedronGeometry args={[1.3,1]}/><meshStandardMaterial color="#708c61" flatShading/></mesh></group> }
function Environment() {
  return <>
    <Box p={[0,-.28,0]} s={[53,.5,40]} c="#b7c1c0"/>
    <Box p={[0,-.012,0]} s={[52.6,.025,39.6]} c="#d2d5d0"/>
    {Array.from({length:15},(_,i)=><Box key={i} p={[-24+i*3.45,.003,0]} s={[.02,.008,39]} c="#c1c7c1"/>)}
    {[-16,-8,0,8,16].map(z=><Box key={z} p={[0,.003,z]} s={[52,.008,.02]} c="#c1c7c1"/>)}
    {[-9,9].map((z,row)=><group key={z}>
      {Array.from({length:8},(_,i)=><Box key={i} p={[(i-3.5)*6.3,.014,z-.8]} s={[.09,.02,14.8]} c="#fbfbf2"/>)}
      <Box p={[0,.014,z-8.2]} s={[44.1,.02,.09]} c="#fbfbf2"/>
      {Array.from({length:7},(_,i)=><group key={i}>
        <Box p={[(i-3)*6.3,.12,z-7.6]} s={[2.5,.24,.35]} c="#919b9d"/>
        <Sign text={`${row?'B':'A'}-0${i+1}`} p={[(i-3)*6.3,.026,z+6.5]} rotation={[-Math.PI/2,0,0]} w={1.45} h={.42} color="#fcfcf2" bg="#d2d5d0"/>
      </group>)}
    </group>)}
    {Array.from({length:10},(_,i)=><Box key={i} p={[-22+i*5,.025,0]} s={[2,.025,.12]} c="#eee1a3"/>)}
    <Box p={[0,1.95,-20]} s={[51,3.9,4]} c="#e8e6dd"/>
    <Box p={[0,3.99,-20]} s={[51.5,.16,4.3]} c="#a8b1b2"/>
    <Box p={[0,3.35,-17.97]} s={[51,.55,.1]} c="#b91c1c"/>
    <Sign text="CHAIRES TRUCKING" p={[-15,3.35,-17.9]} w={11} h={.45} bg="#b91c1c" color="#fff"/>
    <Sign text="PATIO DE UNIDADES" p={[14,3.35,-17.9]} w={9} h={.4} bg="#b91c1c" color="#fff"/>
    {[-19,-12,-5,2,9,16,22].map(x=><group key={x}>
      <Box p={[x,1.45,-17.95]} s={[3.8,2.9,.1]} c="#899a9e"/>
      {Array.from({length:8},(_,i)=><Box key={i} p={[x,.3+i*.33,-17.88]} s={[3.7,.045,.025]} c="#a7b2b2"/>)}
    </group>)}
    <Sign text="A" p={[-24,.05,-9]} rotation={[-Math.PI/2,0,0]} w={2.5} h={2} bg="#d2d5d0" color="#9faeaa"/>
    <Sign text="B" p={[-24,.05,9]} rotation={[-Math.PI/2,0,0]} w={2.5} h={2} bg="#d2d5d0" color="#9faeaa"/>
    <Tree x={25} z={-14}/><Tree x={-25} z={-14}/><Tree x={25} z={15}/><Tree x={-25} z={15}/>
    {[-24,24].map(x=><group key={x}><Box p={[x,3.3,1]} s={[.16,6.6,.16]} c="#6c7e84"/><Box p={[x,6.6,1.3]} s={[.75,.14,.9]} c="#697b83"/></group>)}
  </>
}
function Rig({ selected, mode, zone, reset, controls }) {
  const {size}=useThree()
  useEffect(()=>{
    if(!controls.current)return
    const factor=Math.max(1,1.4/(size.width/size.height))
    let z=zone==='A'?-9:zone==='B'?9:0
    if(selected){ const [x,,zz]=selected.position; const scale=selected.kind==='tractor'?1.1:.85; controls.current.setLookAt(x+13*scale*Math.min(factor,1.65),13*scale*Math.min(factor,1.65),zz+18*scale*Math.min(factor,1.65),x,1.2,zz,true) }
    else if(mode==='top')controls.current.setLookAt(0,60*factor,z+.01,0,0,z,true)
    else controls.current.setLookAt((zone==='all'?34:20)*factor,(zone==='all'?39:31)*factor,z+(zone==='all'?44:40)*factor,0,0,z+1.5,true)
  },[selected,mode,zone,reset,size.width,size.height,controls])
  return <CameraControls ref={controls} makeDefault minDistance={6} maxDistance={180} minPolarAngle={.02} maxPolarAngle={Math.PI/2.15} smoothTime={.4}/>
}
function ShadowRefresh({vehicles,zone,lowPower}) {
  const {gl,invalidate}=useThree()
  useEffect(()=>{gl.shadowMap.needsUpdate=true;invalidate()},[vehicles,zone,lowPower,gl,invalidate])
  return null
}
export default function Yard({ vehicles, selected, onSelect, mode, zone, reset, controls, lowPower }) {
  return <Canvas shadows={!lowPower} frameloop="demand" dpr={lowPower?1:[1,1.5]} camera={{position:[34,39,44],fov:43,near:.1,far:350}} gl={{antialias:true,powerPreference:'low-power'}} onCreated={({gl})=>{gl.shadowMap.autoUpdate=false;gl.shadowMap.needsUpdate=true}} fallback={<div>WebGL no está disponible. Consulta las unidades en la tabla.</div>}>
    <color attach="background" args={['#e6ecec']}/><ambientLight intensity={1.2}/><hemisphereLight args={['#eaf5ff','#b7af94',1.2]}/>
    <directionalLight position={[-24,38,22]} intensity={2.5} castShadow={!lowPower} shadow-mapSize={[2048,2048]} shadow-camera-left={-42} shadow-camera-right={42} shadow-camera-top={42} shadow-camera-bottom={-42} shadow-camera-far={110} shadow-normalBias={.045}/>
    <Environment/>
    {vehicles.filter(v=>zone==='all'||v.zone===zone).map(v=><Vehicle key={v.id} vehicle={v} selected={selected?.id===v.id} onSelect={onSelect}/>)}
    <Rig selected={selected} mode={mode} zone={zone} reset={reset} controls={controls}/>
    <ShadowRefresh vehicles={vehicles} zone={zone} lowPower={lowPower}/>
  </Canvas>
}
