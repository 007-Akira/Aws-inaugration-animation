import * as THREE from 'three';
import {mesh,edges} from './helpers';
export function createCloudMesh(M) {
  const g=new THREE.Group();
  for(const [x,y,z,s] of [[-1.3,-.25,.2,1.25],[0,.35,0,1.7],[1.25,-.15,-.1,1.25],[.7,.85,.2,1]]) {
    const geo=new THREE.IcosahedronGeometry(s,1);mesh(g,geo,M.smokedGlass,[x,y,z]);edges(g,geo,M.wireWhite,[x,y,z]);
  }
  mesh(g,new THREE.SphereGeometry(.7,16,12),M.purpleEmissive).scale.set(1.8,.7,1);
  const satellites=Array.from({length:7},(_,i)=>mesh(g,new THREE.IcosahedronGeometry(.18,0),i%3===0?M.magentaEmissive:M.whiteEmissive));
  g.userData.update=t=>{satellites.forEach((n,i)=>{const a=t*.35+i*Math.PI*2/7;n.position.set(Math.cos(a)*3.1,Math.sin(a*1.15)*1.6,Math.sin(a)*.8);});g.rotation.y=Math.sin(t*.15)*.22;};return g;
}
