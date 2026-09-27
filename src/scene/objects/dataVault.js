import * as THREE from 'three';
import {mesh,box,edges} from './helpers';
export function createDataVault(M) {
  const g=new THREE.Group(),outer=box(3.8,3.8,3.8),innerGeo=box(2.4,2.4,2.4);
  mesh(g,outer,M.smokedGlass);edges(g,outer,M.wireWhite);
  const material=M.smokedGlass.clone();material.emissive.set(0x6d28d9);material.emissiveIntensity=.7;
  const inner=mesh(g,innerGeo,material),innerEdge=edges(g,innerGeo,M.wirePurple);
  const core=mesh(g,new THREE.OctahedronGeometry(.9,0),M.whiteEmissive);
  g.userData.update=t=>{inner.rotation.set(t*.16,t*.21,t*.08);innerEdge.rotation.copy(inner.rotation);core.rotation.y=-t*.45;core.rotation.z=t*.3;};return g;
}
