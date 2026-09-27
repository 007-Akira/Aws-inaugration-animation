import * as THREE from 'three';
import {mesh,mergeStatic} from './helpers';
export function createDatabaseReactor(M) {
  const g=new THREE.Group(),rings=[];
  const core=mesh(g,new THREE.CylinderGeometry(.72,.72,4.4,24),M.purpleEmissive);core.userData.animated=true;
  for(const y of [-1.55,0,1.55]) {
    mesh(g,new THREE.CylinderGeometry(1.65,1.65,.58,32),M.darkMetal,[0,y,0]);
    const ring=mesh(g,new THREE.TorusGeometry(1.85,.055,8,64),M.purpleEmissive,[0,y,0]);ring.rotation.x=Math.PI/2;ring.userData.animated=true;rings.push(ring);
  }
  for(let i=0;i<3;i++) {
    const ring=mesh(g,new THREE.TorusGeometry(2.2+i*.18,.04,6,64),i===1?M.whiteEmissive:M.purpleEmissive);
    ring.rotation.set(Math.PI/2+i*.12,i*.15,i*.25);ring.userData.animated=true;rings.push(ring);
  }
  mergeStatic(g);
  g.userData.update=t=>{rings.forEach((ring,i)=>{ring.rotation.z=t*(.3+i*.09)*(i%2?-1:1);});const s=1+Math.sin(t*2.5)*.025;core.scale.set(s,1,s);};return g;
}
