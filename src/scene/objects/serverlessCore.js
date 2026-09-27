import * as THREE from 'three';
import {mesh} from './helpers';
export function createServerlessCore(M) {
  const g=new THREE.Group(),nucleus=mesh(g,new THREE.SphereGeometry(.88,24,16),M.whiteEmissive);
  mesh(g,new THREE.SphereGeometry(1.15,24,16),M.smokedGlass);
  const rings=[[2.2,.08,[1.1,0,.3]],[2.5,.055,[.3,1.2,0]],[2.75,.045,[.6,.4,1.2]]].map(([r,t,rot],i)=>{const ring=mesh(g,new THREE.TorusGeometry(r,t,8,64),i===1?M.whiteEmissive:M.purpleEmissive);ring.rotation.set(...rot);return ring;});
  const satellites=Array.from({length:5},(_,i)=>mesh(g,new THREE.SphereGeometry(.16,10,8),i===0?M.orangeEmissive:M.purpleEmissive));
  g.userData.update=t=>{rings[0].rotation.z=t*.25;rings[1].rotation.x=.3+t*.2;rings[2].rotation.y=.4-t*.18;
    satellites.forEach((n,i)=>{const a=t*(.55+i*.05)+i,r=2.4+Math.sin(t+i)*.25;n.position.set(Math.cos(a)*r,Math.sin(a*.8)*r,Math.sin(a)*1.15);});nucleus.scale.setScalar(1+Math.sin(t*3.2)*.05);};return g;
}
