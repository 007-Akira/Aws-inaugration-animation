import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export const box = (x,y,z) => new THREE.BoxGeometry(x,y,z);
export function mesh(group,geometry,material,position=[0,0,0]) {
  const item=new THREE.Mesh(geometry,material);item.position.set(...position);group.add(item);return item;
}
export function edges(group,geometry,material,position=[0,0,0]) {
  const item=new THREE.LineSegments(new THREE.EdgesGeometry(geometry),material);item.position.set(...position);group.add(item);return item;
}
export function frame(group,size,material) {const geometry=box(...size);const item=edges(group,geometry,material);geometry.dispose();return item;}
// Static repeated parts share one draw call per material.
export function mergeStatic(group) {
  const batches=new Map();
  for(const child of [...group.children]) {
    if(!child.isMesh || child.userData.animated) continue;
    child.updateMatrix();
    let geometry=child.geometry.clone().applyMatrix4(child.matrix);
    if(geometry.index){const indexed=geometry;geometry=indexed.toNonIndexed();indexed.dispose();}
    if(!batches.has(child.material)) batches.set(child.material,[]);
    batches.get(child.material).push({child,geometry});
  }
  for(const [material,parts] of batches) {
    if(parts.length<2){parts[0].geometry.dispose();continue;}
    const merged=mergeGeometries(parts.map(p=>p.geometry));
    parts.forEach(p=>p.geometry.dispose());
    if(!merged) continue;
    const originals=new Set(parts.map(p=>p.child.geometry));
    parts.forEach(p=>group.remove(p.child));originals.forEach(g=>g.dispose());
    group.add(new THREE.Mesh(merged,material));
  }
}
