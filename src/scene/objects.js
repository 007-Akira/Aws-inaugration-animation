import * as THREE from 'three';
import { createObjectMaterials } from './objects/materials';
import { createTechObject } from './objects/objectFactory';
import { createDetailLibrary } from './details';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { identity } from '../config/identity';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

export function seededRandom(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let n = Math.imul(seed ^ seed >>> 15, 1 | seed); n = n + Math.imul(n ^ n >>> 7, 61 | n) ^ n; return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}

// Geometry and textures are shared by every instance. Per-object draw calls stay small.
export function createObjectLibrary() {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const geometry = value => { geometries.add(value); return value; };
  const material = value => { materials.add(value); return value; };
  const heroMaterials = createObjectMaterials();
  Object.values(heroMaterials).forEach(material);
  const dark = material(new THREE.MeshStandardMaterial({ color: 0x182a38, metalness: 0.38, roughness: 0.42 }));
  const accent = material(new THREE.LineBasicMaterial({ color: identity.violet, transparent: true, opacity: 0.85 }));
  const white = material(new THREE.LineBasicMaterial({ color: 0xaab9c5, transparent: true, opacity: 0.36 }));
  const dim = material(new THREE.LineBasicMaterial({ color: 0x557382, transparent: true, opacity: 0.5 }));
  const nodeMaterial = material(new THREE.MeshStandardMaterial({ color: 0xa8b7c9, metalness: .55, roughness: .3, emissive: 0x627896, emissiveIntensity: .35 }));
  const pulseMaterial = material(new THREE.MeshBasicMaterial({ color: identity.coolWhite }));
  const box = geometry(new RoundedBoxGeometry(2.4, 3.4, 1.1, 2, 0.045));
  const edgeBox = new THREE.BoxGeometry(2.4, 3.4, 1.1);
  const boxEdges = geometry(new THREE.EdgesGeometry(edgeBox)); edgeBox.dispose();
  const cubeBase = new THREE.BoxGeometry(2.2, 2.2, 2.2);
  const cube = geometry(new THREE.EdgesGeometry(cubeBase)); cubeBase.dispose();
  const cylinder = geometry(new THREE.CylinderGeometry(1.15, 1.15, 2.8, 40));
  const indicatorGeometry = geometry(new THREE.BoxGeometry(0.09, 0.045, 0.025));
  const sphere = geometry(new THREE.IcosahedronGeometry(0.065, 1));
  const panel = geometry(new THREE.PlaneGeometry(4.4, 2.8));
  const random = seededRandom(9182);
  const cloudPoints = Array.from({ length: 40 }, () => {
    const angle = random() * Math.PI * 2, phi = Math.acos(2 * random() - 1);
    const bump = 0.82 + random() * 0.28;
    return new THREE.Vector3(Math.cos(angle) * Math.sin(phi) * 2.2 * bump, Math.cos(phi) * 1.05 * bump, Math.sin(angle) * Math.sin(phi) * 0.9 * bump);
  });
  const cloudSolid = new ConvexGeometry(cloudPoints);
  const cloud = geometry(new THREE.WireframeGeometry(cloudSolid)); cloudSolid.dispose();
  function lines(points, mat = white) {
    return new THREE.LineSegments(geometry(new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)))), mat);
  }
  function textTexture(linesOfText, { width = 1024, height = 640, word = false } = {}) {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    if (!word) { ctx.fillStyle = 'rgba(5,16,24,0.72)'; ctx.fillRect(0, 0, width, height); }
    if (!word) {
      ctx.fillStyle = '#152132'; ctx.fillRect(0, 0, width, 54);
      ctx.fillStyle = '#ae92dd';
      for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(24+i*22,27,5,0,Math.PI*2);ctx.fill();}
      ctx.strokeStyle='#26384a'; ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(68,65);ctx.lineTo(68,height-44);ctx.stroke();
      ctx.font='16px monospace';ctx.fillStyle='#526c84';
      for(let i=0;i<14;i++)ctx.fillText(String(i+1).padStart(2,'0'),24,85+i*34);
      for(let i=0;i<32;i++){ctx.fillStyle=i%5===0?'#9b79cb':'#2f526b';ctx.fillRect(720+i%8*30,130+Math.floor(i/8)*52,18,10+i%4*7);}
      ctx.fillStyle='#9cafd0';ctx.font='16px monospace';ctx.fillText('EXECUTION GRAPH',718,102);
      ctx.fillStyle='#162332';ctx.fillRect(0,height-44,width,44);
      ctx.fillStyle='#91a7bb';ctx.fillText('BUILD COMPLETE   32 WORKERS   0 ERRORS   98.2% HEALTH',24,height-15);
    }
    ctx.font = word ? '600 144px Arial' : '22px monospace';
    ctx.textBaseline = 'top';
    linesOfText.forEach((line, index) => {
      ctx.fillStyle = word ? '#c2d3db' : index === 0 ? '#d8e6eb' : index % 4 === 0 ? '#bac4d8' : '#8ea3af';
      ctx.fillText(line, word ? 8 : 88, word ? 16 : 70 + index * 34);
    });
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.add(texture);
    return texture;
  }
  const codeMap = textTexture([
    'builder@cloud:~  / deploy', '', 'const stream = await connect({', '  region: "edge",', '  capacity: autoscale(workload),', '  runtime: isolated()', '});', '', 'stream.on("build", async node => {', '  await graph.resolve(node);', '  return pipeline.execute();', '});', '', '> deployment ready  // 200 OK',
  ]);
  const codeMaterial = material(new THREE.MeshBasicMaterial({ map: codeMap, transparent: true, opacity: 0.78, side: THREE.DoubleSide, depthWrite: false }));
  const techLines = [];
  for (let i = 0; i < 13; i++) {
    const y = -1.2 + i * 0.19;
    const bend = -0.9 + (i % 4) * 0.32;
    techLines.push([-2, y, 0.02], [bend, y, 0.02], [bend, y, 0.02], [bend + 0.4, y + 0.35, 0.02], [bend + 0.4, y + 0.35, 0.02], [2, y + 0.35, 0.02]);
  }
  const architectureGeometry = geometry(new THREE.BufferGeometry().setFromPoints(techLines.map(p => new THREE.Vector3(...p))));
  const transparentPanel = material(new THREE.MeshBasicMaterial({ color: 0x142632, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
  // Pre-merge repeated server vents into a single mesh.
  const vents = [];
  for (let row = 0; row < 21; row++) { const g = new THREE.BoxGeometry(2.16, 0.022, 0.04); g.translate(0, -1.48 + row * 0.148, 0.575); vents.push(g); }
  const ventGeometry = geometry(mergeGeometries(vents)); vents.forEach(g => g.dispose());
  const ringPositions = [];
  for (let ring = 0; ring < 4; ring++) for (let j = 0; j < 48; j++) {
    const a = j / 48 * Math.PI * 2, b = (j + 1) / 48 * Math.PI * 2, y = -1.25 + ring * 0.83;
    ringPositions.push([Math.cos(a) * 1.16, y, Math.sin(a) * 1.16], [Math.cos(b) * 1.16, y, Math.sin(b) * 1.16]);
  }
  const rings = geometry(new THREE.BufferGeometry().setFromPoints(ringPositions.map(p => new THREE.Vector3(...p))));
  // A connected 3D graph with a small inner cluster and an open outer shell.
  // Nearest-neighbour edges keep the structure legible instead of a solid mesh.
  const networkPoints = [new THREE.Vector3(0, 0, 0)];
  for (let i = 0; i < 20; i++) {
    const angle = i * 2.3999632297;
    const radius = i < 7 ? 0.8 + random() * 0.4 : 1.65 + random() * 0.55;
    networkPoints.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.85, (random() - 0.5) * 2.8));
  }
  const links = [], connected = new Set();
  function connect(a, b) {
    const low = Math.min(a, b), high = Math.max(a, b), key = `${low}:${high}`;
    if (!connected.has(key)) { connected.add(key); links.push([low, high]); }
  }
  for (let i = 1; i < networkPoints.length; i++) {
    // Connecting to an earlier vertex guarantees one connected graph.
    const nearer = networkPoints.slice(0, i).map((point, j) => ({ index: j, distance: point.distanceToSquared(networkPoints[i]) })).sort((a,b) => a.distance-b.distance);
    nearer.slice(0, 2).forEach(point => connect(i, point.index));
  }
  const networkLines = geometry(new THREE.BufferGeometry().setFromPoints(links.flatMap(([a, b]) => [networkPoints[a], networkPoints[b]])));
  const details = createDetailLibrary({ geometry, material, texture: value => { textures.add(value); return value; } });
  const matrix = new THREE.Matrix4();
  function create(type, { detail = true } = {}) {
    const group = new THREE.Group(); group.name = type;
    if (detail && ['compute','database','cloud','cube','vault','serverless','neural','code'].includes(type)) {
      const model = createTechObject(type === 'cube' ? 'vault' : type, heroMaterials);
      // Preserve each authored fly-by's size and path; animate only its inner model.
      const scales = {compute:.57,database:.58,cloud:.72,cube:.58,vault:.58,serverless:.8,neural:1,code:1};
      model.scale.setScalar(scales[type]);model.userData.update?.(0,0);
      group.add(model);group.userData.update = time => model.userData.update?.(time);
      model.traverse(node => {
        if(node.geometry) geometry(node.geometry);
        if(node.material) (Array.isArray(node.material)?node.material:[node.material]).forEach(value=>{material(value);if(value.map)textures.add(value.map);});
      });
      return group;
    }

    if (type === 'compute') {
      group.add(new THREE.Mesh(box, dark), new THREE.LineSegments(boxEdges, accent), new THREE.Mesh(ventGeometry, dark));
      const count = detail ? 8 : 12;
      const indicators = new THREE.InstancedMesh(indicatorGeometry, pulseMaterial, count);
      for (let i = 0; i < count; i++) { matrix.makeTranslation(detail ? 0.64 : 0.8, detail ? -1.34 + i * 0.35 : 1.3 - i * 0.235, detail ? 0.70 : 0.6); indicators.setMatrixAt(i, matrix); }
      group.add(indicators);
    } else if (type === 'database') {
      group.add(new THREE.Mesh(cylinder, dark), new THREE.LineSegments(rings, accent));
    } else if (type === 'cloud') {
      group.add(new THREE.LineSegments(cloud, white));
    } else if (type === 'cube') {
      group.add(new THREE.LineSegments(cube, white));
      const inner = new THREE.LineSegments(cube, accent); inner.scale.setScalar(0.6); inner.rotation.y = 0.2; group.add(inner);
    } else if (type === 'code') {
      group.add(new THREE.Mesh(panel, codeMaterial));
    } else if (type === 'architecture') {
      group.add(new THREE.Mesh(panel, transparentPanel), new THREE.LineSegments(architectureGeometry, white));
    } else if (type === 'network') {
      group.add(new THREE.LineSegments(networkLines, white));
      const nodes = new THREE.InstancedMesh(sphere, nodeMaterial, networkPoints.length);
      networkPoints.forEach((point, i) => { matrix.makeTranslation(point.x, point.y, point.z); nodes.setMatrixAt(i, matrix); });
      group.add(nodes);
      const pulses = new THREE.InstancedMesh(sphere, pulseMaterial, 5);
      pulses.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      pulses.frustumCulled = false; // Traffic moves beyond its initial instance bounds.
      group.add(pulses);
      const point = new THREE.Vector3();
      group.userData.update = (time, energy) => {
        for (let i = 0; i < 5; i++) {
          const [a, b] = links[i * 3];
          point.lerpVectors(networkPoints[a], networkPoints[b], (time * (0.4 + energy * 0.12) + i * 0.17) % 1);
          matrix.makeTranslation(point.x, point.y, point.z); pulses.setMatrixAt(i, matrix);
        }
        pulses.instanceMatrix.needsUpdate = true;
      };
    }
    if (detail) {
      const surfaces = details.create(type);
      group.add(surfaces);
    }
    return group;
  }
  function word(text) {
    const map = textTexture([text], { width: 1024, height: 192, word: true });
    const mat = material(new THREE.MeshBasicMaterial({ map, transparent: true, opacity: 0.48, depthWrite: false, side: THREE.DoubleSide }));
    return new THREE.Mesh(geometry(new THREE.PlaneGeometry(8, 1.5)), mat);
  }
  return { create, word, accent, dispose() { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); } };
}
