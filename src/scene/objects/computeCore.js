import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mesh,box,mergeStatic} from './helpers';
export function createComputeCore(M) {
  const g=new THREE.Group(),reactor=M.purpleEmissive.clone();
  mesh(g,new RoundedBoxGeometry(2,5.8,2,2,.045),M.darkMetal);
  for(const x of [-1.35,1.35])mesh(g,new RoundedBoxGeometry(.85,5.4,1.85,2,.035),M.darkMetalSoft,[x,0,0]);
  for(let i=-4;i<=4;i++)mesh(g,box(.11,4.7,.07),i===-4||i===4?reactor:M.darkMetalSoft,[i*.19,0,1.04]);
  for(let i=-2;i<=2;i++)mesh(g,box(.13,2,.08),reactor,[i*.26,-1.3,1.08]);
  for(let i=0;i<4;i++)mesh(g,new THREE.SphereGeometry(.035,8,6),i===0?M.orangeEmissive:M.whiteEmissive,[-1.62,1.7-i*.28,.95]);
  mergeStatic(g);
  g.userData.update=t=>{reactor.emissiveIntensity=.45+Math.sin(t*.8)*.08;};return g;
}
