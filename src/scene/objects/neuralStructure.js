import * as THREE from 'three';
import {mesh} from './helpers';
export function createNeuralStructure(M) {
  const g=new THREE.Group(),points=[[0,2.2,0],[-1.6,1.1,.7],[1.6,1.1,-.7],[-2,-.2,.2],[2,-.2,-.2],[-1.2,-1.7,-.8],[1.2,-1.7,.8],[0,.2,1.5],[0,-.2,-1.5],[0,-2.2,0]].map(p=>new THREE.Vector3(...p));
  const nodes=points.map((p,i)=>mesh(g,new THREE.SphereGeometry(i===0?.14:.09,12,8),i%4===0?M.purpleEmissive:M.whiteEmissive,p.toArray()));
  const lines=[];points.forEach((a,i)=>points.forEach((b,j)=>{if(j>i&&a.distanceTo(b)<3.3)lines.push(a,b);}));
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lines),M.wirePurple));
  const core=mesh(g,new THREE.OctahedronGeometry(.72,0),M.smokedGlass);
  g.userData.update=t=>{g.rotation.y=t*.16;g.rotation.z=Math.sin(t*.2)*.12;nodes.forEach((n,i)=>n.scale.setScalar(1+Math.sin(t*2.2+i*.6)*.1));core.rotation.y=-t*.5;};return g;
}
