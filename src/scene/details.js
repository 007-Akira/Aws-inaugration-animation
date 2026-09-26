import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { identity } from '../config/identity';

// Hero detailing is built once, then shared by every instance. Hundreds of small
// mechanical parts become a handful of merged surfaces, not hundreds of draw calls.
export function createDetailLibrary({ geometry, material, texture }) {
  const cache = new Map();
  const steel = material(new THREE.MeshStandardMaterial({ color: 0x596777, metalness: 0.55, roughness: 0.42 }));
  const recess = material(new THREE.MeshStandardMaterial({ color: 0x070c14, metalness: 0.35, roughness: 0.65 }));
  const cool = material(new THREE.LineBasicMaterial({ color: 0x8cabbf, transparent: true, opacity: 0.62 }));
  const purple = material(new THREE.LineBasicMaterial({ color: identity.violet, transparent: true, opacity: 0.78 }));
  const silver = material(new THREE.MeshBasicMaterial({ color: 0xc8d9e4 }));
  const chipMaterial = material(new THREE.MeshStandardMaterial({ color: 0x333047, metalness: 0.5, roughness: 0.4 }));
  const shellMaterial = material(new THREE.MeshBasicMaterial({ color: identity.violet, transparent: true, opacity: 0.035, depthWrite: false, side: THREE.DoubleSide }));
  function box(w, h, d, x, y, z) { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; }
  function merged(parts, mat) {
    const result = geometry(mergeGeometries(parts)); parts.forEach(part => part.dispose());
    return new THREE.Mesh(result, mat);
  }
  function segments(points, mat = cool) {
    return new THREE.LineSegments(geometry(new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)))), mat);
  }
  function circle(points, radius, y, zOffset = 0, count = 64) {
    for (let i = 0; i < count; i++) {
      const a = i / count * Math.PI * 2, b = (i + 1) / count * Math.PI * 2;
      points.push([Math.cos(a) * radius, y, Math.sin(a) * radius + zOffset], [Math.cos(b) * radius, y, Math.sin(b) * radius + zOffset]);
    }
  }
  // One small shared atlas provides serial plates, technical labels and microprinting.
  const atlasCanvas = document.createElement('canvas'); atlasCanvas.width = 2048; atlasCanvas.height = 1024;
  const ctx = atlasCanvas.getContext('2d');
  const labels = [
    ['COMPUTE / C-07', '32 vCPU  |  128 GiB', 'LINK 01  /  ONLINE', '••••••••  96.4%'],
    ['STORAGE / DB-03', 'REPLICA SET : 03', 'IOPS 128K  |  SYNC', 'ENCRYPTED / READY'],
    ['CLOUD FABRIC', 'REGION : EDGE-01', 'AUTOSCALE ENABLED', 'ROUTE / HEALTHY'],
    ['NETWORK / MESH', 'PEERS 013 / ACTIVE', 'LATENCY 0.8 ms', 'PACKET FLOW / LIVE'],
    ['DATA / VOLUME 09', 'SHARDS 027', 'CHECKSUM : VERIFIED', 'REPLICATION 3x'],
    ['BUILD / EXECUTION', 'PIPELINE 0241', 'RUNNING / 200 OK', 'RELEASE : STABLE'],
    ['ARCHITECTURE / A-01', 'COMPUTE + STORAGE', 'BUS 04 / CONNECTED', 'FAILOVER : ARMED'],
  ];
  labels.forEach((lines, i) => {
    const x = i % 4 * 512, y = Math.floor(i / 4) * 512;
    ctx.fillStyle = '#071019'; ctx.fillRect(x, y, 512, 512);
    ctx.strokeStyle = '#62778b'; ctx.lineWidth = 2; ctx.strokeRect(x + 8, y + 8, 496, 496);
    ctx.fillStyle = '#a78ad5'; ctx.fillRect(x + 22, y + 24, 8, 30);
    lines.forEach((line, row) => { ctx.font = row ? '24px monospace' : 'bold 30px monospace'; ctx.fillStyle = row ? '#9db2c5' : '#e1e7f3'; ctx.fillText(line, x + 44, y + 52 + row * 67); });
    for (let bar = 0; bar < 54; bar++) {
      ctx.fillStyle = bar % 4 ? '#526e87' : '#ab8ed3';
      ctx.fillRect(x + 34 + bar * 8, y + 330, 2 + bar % 3, 62 - bar % 5 * 7);
    }
    ctx.font = '18px monospace'; ctx.fillStyle = '#63758c'; ctx.fillText('SBG / TKMCE  •  SYSTEM READY', x + 34, y + 451);
  });
  const atlas = texture(new THREE.CanvasTexture(atlasCanvas)); atlas.colorSpace = THREE.SRGBColorSpace;
  const atlasMaterial = material(new THREE.MeshBasicMaterial({ map: atlas, transparent: false, side: THREE.DoubleSide }));
  function plaque(index, w, h, x, y, z) {
    const g = new THREE.PlaneGeometry(w, h); const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (index % 4 + 0.015 + uv.getX(i) * 0.97) / 4, (1 - Math.floor(index / 4) + 0.015 + uv.getY(i) * 0.97) / 2);
    const mesh = new THREE.Mesh(geometry(g), atlasMaterial); mesh.position.set(x, y, z); return mesh;
  }
  function build(type) {
    const group = new THREE.Group(); group.name = 'surface-detail';
    const parts = [], darkParts = [], traces = [], accents = [];
    if (type === 'compute') {
      parts.push(box(0.1, 3.28, 0.12, -1.1, 0, 0.58), box(0.1, 3.28, 0.12, 1.1, 0, 0.58));
      for (let row = 0; row < 8; row++) {
        const y = -1.34 + row * 0.35;
        parts.push(box(1.99, 0.29, 0.1, 0, y, 0.59));
        darkParts.push(box(1.67, 0.23, 0.024, -0.05, y, 0.65));
        for (let slot = 0; slot < 7; slot++) parts.push(box(0.012, 0.18, 0.027, -0.73 + slot * 0.18, y, 0.67));
        parts.push(box(0.06, 0.17, 0.055, 0.87, y, 0.675));
        accents.push([-1, y - 0.145, 0.66], [1, y - 0.145, 0.66]);
        for (const x of [-1.105, 1.105]) {
          const bolt = new THREE.CylinderGeometry(0.023, 0.023, 0.018, 6); bolt.rotateX(Math.PI / 2); bolt.translate(x, y, 0.66); parts.push(bolt);
        }
      }
      for (let i = 0; i < 24; i++) {
        parts.push(box(0.025, 2.9, 0.024, -1.215, 0, -0.45 + i * 0.038));
        parts.push(box(0.025, 2.9, 0.024, 1.215, 0, -0.45 + i * 0.038));
      }
      group.add(merged(parts, steel), merged(darkParts, recess), segments(accents, purple), plaque(0, 1.82, 0.27, 0, 1.48, 0.7));
    } else if (type === 'database') {
      for (let i = 0; i < 5; i++) {
        const disc = new THREE.CylinderGeometry(1.18, 1.18, 0.065, 40); disc.translate(0, -1.38 + i * 0.69, 0); parts.push(disc);
        circle(traces, 1.186, -1.38 + i * 0.69);
      }
      for (const radius of [0.22, 0.45, 0.72, 0.99]) circle(traces, radius, 1.416);
      for (let i = 0; i < 32; i++) {
        const a = i / 32 * Math.PI * 2;
        accents.push([Math.cos(a)*0.85,1.42,Math.sin(a)*0.85],[Math.cos(a)*1.10,1.42,Math.sin(a)*1.10]);
      }
      const hub = new THREE.CylinderGeometry(0.18,0.18,0.08,16); hub.translate(0,1.44,0); parts.push(hub);
      group.add(merged(parts, steel), segments(traces), segments(accents, purple), plaque(1, 0.86, 0.53, 0, 0.12, 1.17));
    } else if (type === 'architecture') {
      // Raised processor packages and a dense, layered PCB routing network.
      const chips = [[0,0,1.05,0.72],[-1.5,0.85,0.58,0.4],[1.55,0.85,0.54,0.4],[-1.5,-0.8,0.6,0.45],[1.5,-0.8,0.6,0.45]];
      chips.forEach(([x,y,w,h]) => {
        darkParts.push(box(w,h,0.13,x,y,0.10));
        for (let j=0;j<8;j++) {
          const dx=-w/2+0.045+j*(w-0.09)/7;
          parts.push(box(0.025,0.13,0.04,x+dx,y-h/2-0.045,0.065),box(0.025,0.13,0.04,x+dx,y+h/2+0.045,0.065));
        }
      });
      for (let i=0;i<22;i++) {
        const side=i%2?1:-1, y=-1.14+Math.floor(i/2)*0.22, offset=0.54+(i%4)*0.065;
        traces.push([side*2.06,y,0.03],[side*(1.15+(i%3)*0.08),y,0.03],[side*(1.15+(i%3)*0.08),y,0.03],[side*offset,y*0.45,0.03],[side*offset,y*0.45,0.03],[side*0.55,y*0.45,0.03]);
      }
      for (let i=0;i<12;i++) { const x=-1.95+i*0.35; parts.push(box(0.16,0.05,0.07,x,1.31,0.05),box(0.16,0.05,0.07,x,-1.31,0.05)); }
      group.add(merged(parts, steel), merged(darkParts, chipMaterial), segments(traces, purple), plaque(6, 0.84, 0.51, 0, 0, 0.172));
    } else if (type === 'cube') {
      for (let x=-1;x<=1;x+=2) for(let y=-1;y<=1;y+=2) for(let z=-1;z<=1;z+=2) {
        for (let axis=0;axis<3;axis++) { const a=[x*1.13,y*1.13,z*1.13], b=[...a]; b[axis]*=0.72; accents.push(a,b); }
        parts.push(box(0.11,0.11,0.11,x*1.08,y*1.08,z*1.08));
      }
      const voxelGeometry=geometry(new THREE.BoxGeometry(0.20,0.20,0.20));
      const voxels=new THREE.InstancedMesh(voxelGeometry,chipMaterial,27); const matrix=new THREE.Matrix4(); let index=0;
      for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){ matrix.makeTranslation(x*0.41,y*0.41,z*0.41); voxels.setMatrixAt(index++,matrix); }
      group.add(merged(parts,steel),segments(accents,purple),voxels,plaque(4,0.74,0.24,0,-0.86,1.12));
    } else if (type === 'cloud') {
      for(let i=0;i<30;i++) {
        const a=i/30*Math.PI*2, b=(i+1)/30*Math.PI*2;
        const p=[Math.cos(a)*1.75,Math.sin(a)*0.7,Math.sin(a*3)*0.32];
        traces.push(p,[Math.cos(b)*1.75,Math.sin(b)*0.7,Math.sin(b*3)*0.32]);
        accents.push(p,[p[0]*0.4,p[1]*0.4,p[2]+0.55]);
        if(i%3===0)parts.push(box(0.11,0.11,0.11,...p));
      }
      const core=geometry(new THREE.IcosahedronGeometry(0.55,1));
      const coreEdges=geometry(new THREE.EdgesGeometry(core));
      group.add(segments(traces),segments(accents,purple),merged(parts,silver),new THREE.Mesh(core,shellMaterial),new THREE.LineSegments(coreEdges,cool));
    } else if (type === 'network') {
      // Detail sockets share the same deterministic points supplied by the base library.
      group.add(plaque(3,1.05,0.32,0,-2.06,0));
    } else if (type === 'code') {
      parts.push(box(4.48,0.035,0.12,0,1.42,-0.04),box(4.48,0.035,0.12,0,-1.42,-0.04),box(0.035,2.84,0.12,-2.24,0,-0.04),box(0.035,2.84,0.12,2.24,0,-0.04));
      for(let i=0;i<20;i++) { const x=-1.95+i*0.205; traces.push([x,-1.44,0.02],[x,-1.39,0.02]); }
      group.add(merged(parts,steel),segments(traces,purple));
    }
    return group;
  }
  return { create(type) { if(!cache.has(type))cache.set(type,build(type)); return cache.get(type).clone(true); } };
}
