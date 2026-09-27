import * as THREE from 'three';
import {mesh,box,edges,mergeStatic} from './helpers';
export function createCodePanel(M) {
  const g=new THREE.Group(),geo=box(4.2,3,.12);mesh(g,geo,M.smokedGlass);edges(g,geo,M.wirePurple);
  [[1.7,.85,M.whiteEmissive],[2.6,.55,M.purpleEmissive],[2.2,.25,M.whiteEmissive],[2.9,-.05,M.magentaEmissive],[1.8,-.35,M.purpleEmissive],[2.4,-.65,M.whiteEmissive]].forEach(([w,y,m])=>mesh(g,box(w,.07,.025),m,[-.65+w/4,y,.075]));
  for(let i=0;i<4;i++)mesh(g,box(.18,.18,.025),i===2?M.orangeEmissive:M.purpleEmissive,[-1.72,.75-i*.45,.075]);
  mergeStatic(g);
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=448;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#080814';ctx.fillRect(0,0,768,448);
  ctx.font='bold 38px monospace';ctx.fillStyle='#ddcfff';ctx.fillText('API / BUILD',32,66);
  ctx.font='32px monospace';['POST /deploy','await cloud.connect()','graph.run({ scale: true })','200 OK  // READY'].forEach((line,i)=>{ctx.fillStyle=i===3?'#d7e8ee':i%2?'#bd90f0':'#96aac7';ctx.fillText(line,32,150+i*72);});
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  mesh(g,new THREE.PlaneGeometry(3.3,1.93),new THREE.MeshBasicMaterial({map}),[.25,0,.105]);
  g.userData.update=t=>{g.rotation.y=-.18+Math.sin(t*.3)*.05;g.position.y=Math.sin(t*.7)*.08;};return g;
}
