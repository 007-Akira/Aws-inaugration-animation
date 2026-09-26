import * as THREE from 'three';
import { identity, voidTreatment } from '../config/identity';
import { createObjectLibrary, seededRandom } from './objects';
import { createParticleField } from './particles';
import { createEntryCorridor } from './entryCorridor';
import { universeConfig, actTwoTiming, cameraDistance, debugDefaults, entryTravel } from '../config/actTwo';

export function createUniverse(effects) {
  const { scene, camera } = effects;
  const library = createObjectLibrary();
  const particles = createParticleField();
  const corridor = createEntryCorridor();
  const root = new THREE.Group(); root.name = 'computational-universe';
  scene.add(root);
  scene.background = new THREE.Color(identity.void);
  scene.fog = new THREE.FogExp2(identity.void, universeConfig.fogDensity);
  camera.fov = 62; camera.near = 0.15; camera.far = 1800; camera.updateProjectionMatrix();
  const ambient = new THREE.HemisphereLight(0x799ebd, 0x080b12, 0.65);
  const key = new THREE.DirectionalLight(0x9ec4e0, 2.3); key.position.set(-12, 18, 16);
  const rim = new THREE.DirectionalLight(identity.violet, 1.5); rim.position.set(3, 0, -20);
  root.add(ambient, key, rim, particles.group, corridor.group);
  const objects = [];
  function add(type, position, scale, rotation, secondary = false, index = 0) {
    const mesh = library.create(type, { detail: !secondary });
    position = [position[0], position[1], position[2] - entryTravel];
    mesh.position.set(...position); mesh.rotation.set(...rotation); mesh.scale.setScalar(scale);
    root.add(mesh);
    objects.push({ mesh, detail: mesh.getObjectByName('surface-detail'), x: position[0], y: position[1], z: position[2], rotation: [...rotation], secondary, index });
  }
  universeConfig.heroes.forEach((item, index) => add(...item, false, index));
  const random = seededRandom(universeConfig.seed + 12);
  const types = ['cube', 'architecture', 'network', 'database', 'cloud', 'compute'];
  for (let i = 0; i < 22; i++) {
    const side = i % 2 ? -1 : 1;
    add(types[i % types.length], [side * (18 + random() * 35), (random() - 0.5) * 38, -100 - i * 23 - random() * 16], 0.7 + random() * 1.7, [random() * 0.35, side * 0.4, (random() - 0.5) * 0.4], true, i);
  }
  ['BUILD', 'COMPUTE', 'CLOUD', 'DATA', 'DEPLOY', 'AI'].forEach((text, i) => {
    const mesh = library.word(text);
    const x = (i % 2 ? -1 : 1) * (13 + i * 1.5), y = i % 3 === 0 ? 9 : -5 + i;
    mesh.position.set(x, y, -100 - i * 63 - entryTravel); mesh.rotation.y = i % 2 ? 0.3 : -0.3;
    root.add(mesh);
    objects.push({ mesh, x, y, z: mesh.position.z, rotation: [0, mesh.rotation.y, 0], secondary: false, index: i });
  });
  // Procedural radial light billboards: depth-bearing glow without postprocessing bloom.
  const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 256;
  const ctx = glowCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255,255,255,1)'); gradient.addColorStop(0.025, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.08, 'rgba(255,255,255,0.9)'); gradient.addColorStop(0.22, 'rgba(255,255,255,0.3)');
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.05)'); gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(glowCanvas); texture.colorSpace = THREE.SRGBColorSpace;
  const glowMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false });
  const glow = new THREE.Sprite(glowMaterial); glow.position.set(0, 0, -1050); glow.scale.set(210, 210, 1);
  const flareMaterial = glowMaterial.clone(); const flare = new THREE.Sprite(flareMaterial);
  flare.position.copy(glow.position); flare.scale.set(820, 7, 1);
  const coreMaterial = glowMaterial.clone();
  const core = new THREE.Sprite(coreMaterial); core.position.copy(glow.position); core.position.z += 0.1;
  root.add(glow, flare, core);
  const violetColor = new THREE.Color(identity.violet), orangeColor = new THREE.Color(identity.orange);
  // Large, world-space translucent volumes suggest dusty blue light shafts.
  // Four cheap billboards provide depth haze without a raymarch or full-frame blur.
  const hazeGeometry = new THREE.PlaneGeometry(1, 1);
  const hazeMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uEnergy: { value: 1 }, uRays: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uEnergy, uRays;
      void main(){
        vec2 p=(vUv-0.5)*2.0;
        float radius=length(p);
        float a=atan(p.y,p.x);
        float ray=pow(abs(sin(a*7.0+0.2)),12.0)*0.12+pow(abs(sin(a*13.0)),18.0)*0.045;
        float glow=exp(-radius*radius*5.0)*(0.09+ray*uRays);
        float edge=1.0-smoothstep(0.45,1.0,radius);
        gl_FragColor=vec4(vec3(0.23,0.12,0.36),glow*edge*uEnergy);
      }
    `,
  });
  const haze = [];
  for (let i=0;i<4;i++) {
    const plane=new THREE.Mesh(hazeGeometry,hazeMaterial);
    plane.position.set(0,0,-260-i*230); plane.scale.set(550,360,1); plane.rotation.z=i*0.71;
    root.add(plane); haze.push(plane);
  }
  const defaults = { cameraSpeed: 25, particleSpeed: 0.03, streakLength: 0.05, orangeEnergyIntensity: 0.05, objectDensity: 0.2, cameraShake: 0.08, collapse: 0, emergence: 0, voidOpacity: 0.18, entryProgress: 0, orangeBlend: 0 };
  const controls = { ...defaults };
  const tuning = { ...debugDefaults };
  let currentTime = 0;
  function render(time = currentTime) {
    currentTime = time;
    const t = Math.max(0, Math.min(time, actTwoTiming.flyDuration));
    const drift = controls.cameraShake * tuning.cameraDrift;
    camera.position.set(Math.sin(t * 0.65) * drift * 0.9, Math.sin(t * 0.43) * drift * 0.55, -entryTravel * controls.entryProgress - cameraDistance(t, controls.cameraSpeed) * tuning.cameraSpeed);
    camera.rotation.set(Math.sin(t * 0.53) * drift * 0.0015, Math.sin(t * 0.4) * drift * 0.0015, Math.sin(t * 0.55) * drift * 0.008);
    const energy = controls.orangeEnergyIntensity * tuning.orangeEnergy;
    const convergence = controls.collapse;
    scene.fog.density = universeConfig.fogDensity * tuning.fogDepth * (1 + (1 - controls.emergence) * 2.6);
    root.visible = true;
    const orangeMix = controls.orangeBlend;
    rim.color.lerpColors(violetColor, orangeColor, orangeMix * 0.85);
    glowMaterial.color.lerpColors(violetColor, orangeColor, orangeMix);
    flareMaterial.color.copy(glowMaterial.color);
    library.accent.opacity = Math.min(0.95, 0.5 + energy * 0.12);
    rim.intensity = 0.8 + energy * 0.6;
    glowMaterial.opacity = Math.min(1, voidTreatment.beaconOpacity + controls.entryProgress * 0.12 + controls.emergence * energy * 0.12);
    flareMaterial.opacity = glowMaterial.opacity * 0.7;
    glow.scale.setScalar(THREE.MathUtils.lerp(voidTreatment.beaconSize, 310 + energy * 42 + convergence * 220, controls.emergence));
    hazeMaterial.uniforms.uEnergy.value = controls.voidOpacity * 0.2 + controls.emergence * (0.8 + energy * 0.12);
    hazeMaterial.uniforms.uRays.value = controls.emergence;
    coreMaterial.opacity = glowMaterial.opacity;
    core.scale.setScalar(THREE.MathUtils.lerp(28, 14 + energy * 8, controls.emergence));
    flare.scale.set(THREE.MathUtils.lerp(190, 780 + convergence * 500, controls.emergence), 5 + energy * 2, 1);
    for (const item of objects) {
      const ahead = camera.position.z - item.z;
      // Finite authored fly-bys remain in world space and are never teleported/recycled.
      // Distance fog, rather than a density gate, reveals each silhouette continuously.
      const fogVisibility = Math.exp(-((Math.max(0, ahead) * scene.fog.density) ** 2));
      item.mesh.visible = controls.emergence > 0.001 && ahead > -35 && ahead < 700 && fogVisibility > 0.002;
      if (item.mesh.isMesh) item.mesh.material.opacity = 0.48 * THREE.MathUtils.smoothstep(controls.emergence, 0.55, 1);
      item.mesh.position.set(item.x * (1 - convergence * 0.97), item.y * (1 - convergence * 0.97), item.z - convergence * 240);
      item.mesh.rotation.set(item.rotation[0], item.rotation[1] + Math.sin(t * 0.4 + item.index) * 0.045, item.rotation[2]);
      // Fine surfaces are only needed on nearby heroes; distant silhouettes stay cheap.
      if (item.detail) item.detail.visible = ahead < 185;
      if (item.mesh.visible) item.mesh.userData.update?.(t, energy);
    }
    corridor.update(controls.emergence, time, convergence, effects.renderer?.getPixelRatio() ?? 1);
    particles.update({
      cameraZ: camera.position.z, advance: t * controls.particleSpeed * 2 + controls.entryProgress * 3 + Math.max(0, Math.min(time + actTwoTiming.darknessDuration, actTwoTiming.darknessDuration)) * 6,
      length: controls.streakLength * tuning.streakIntensity,
      energy, orangeMix, collapse: convergence, opacity: THREE.MathUtils.lerp(controls.voidOpacity, 1, controls.emergence),
      density: THREE.MathUtils.lerp(voidTreatment.particleDensity, 0.28 + controls.objectDensity * 0.72, controls.emergence) * tuning.particleDensity,
    });
    effects.render();
  }
  function reset() {
    Object.assign(tuning, debugDefaults);
    Object.assign(controls, defaults);
    camera.position.set(0, 0, 0); camera.rotation.set(0, 0, 0);
    currentTime = 0; render(-1);
  }
  return { controls, tuning, render, reset,
    async prepare() {
      root.visible = true;
      // Reset now renders the void; reveal hidden technology temporarily for GPU warm-up.
      objects.forEach(item => { item.mesh.visible = true; });
      corridor.group.visible = true; // Compile both entry shaders before the inauguration click.
      const ready = await effects.prepare();
      if (ready) effects.render(); // Upload textures and buffers before enabling the trigger.
      render(-1);
      return ready;
    },
    get telemetry() { return { cameraZ: camera.position.z, visibleObjects: objects.filter(o => o.mesh.visible).length, drawCalls: effects.renderer?.info.render.calls ?? 0 }; },
    dispose() { root.traverse(object => { if (object.isInstancedMesh) object.dispose(); }); scene.remove(root); hazeGeometry.dispose(); hazeMaterial.dispose(); library.dispose(); particles.dispose(); corridor.dispose(); texture.dispose(); glowMaterial.dispose(); flareMaterial.dispose(); coreMaterial.dispose(); scene.fog = null; scene.background = null; },
  };
}
