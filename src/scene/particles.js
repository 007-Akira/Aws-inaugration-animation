import * as THREE from 'three';
import { identity } from '../config/identity';
import { universeConfig } from '../config/actTwo';
import { seededRandom } from './objects';

export function createParticleField() {
  const count = universeConfig.particleCount;
  const random = seededRandom(universeConfig.seed);
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 6 + Math.pow(random(), 0.65) * 160;
    seeds.set([Math.cos(angle) * radius, Math.sin(angle) * radius * 0.72, -random() * universeConfig.particleDepth, ((i % 20) + 0.5) / 20], i * 4);
  }
  const uniforms = {
    uCameraZ: { value: 0 }, uAdvance: { value: 0 }, uLength: { value: 0.2 },
    uEnergy: { value: 0 }, uOrangeMix: { value: 0 },
    uWhite: { value: new THREE.Color(identity.coolWhite) }, uViolet: { value: new THREE.Color(identity.violet) }, uWarm: { value: new THREE.Color(identity.orange) }, uCollapse: { value: 0 }, uOpacity: { value: 0 },
    uDepth: { value: universeConfig.particleDepth },
  };
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0], 3));
  geometry.setIndex([0, 1, 2, 2, 1, 3]);
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4));
  geometry.instanceCount = count;
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec4 aSeed;
      uniform float uCameraZ, uAdvance, uLength, uCollapse, uDepth;
      varying float vEnd, vSide, vTint, vFade;
      void main() {
        // Recycle only after the HEAD passes 2 units behind the camera.
        float relativeZ = 2.0 - mod(2.0 - (aSeed.z - uCameraZ + uAdvance), uDepth);
        relativeZ = mix(relativeZ, -260.0, uCollapse);
        vec2 xy = aSeed.xy * (1.0 - uCollapse * 0.995);
        vec4 view = modelViewMatrix * vec4(xy, uCameraZ + relativeZ - position.y * uLength, 1.0);
        vec2 perpendicular = normalize(vec2(-view.y, view.x) + vec2(0.0001));
        view.xy += perpendicular * position.x * (0.045 + aSeed.w * 0.055);
        gl_Position = projectionMatrix * view;
        vEnd = position.y; vSide = position.x;
        vTint = aSeed.w;
        vFade = (1.0 - smoothstep(-6.0, 1.0, relativeZ)) * exp(-abs(relativeZ) * 0.0035);
      }
    `,
    fragmentShader: `
      uniform float uEnergy, uOpacity, uOrangeMix;
      uniform vec3 uWhite, uViolet, uWarm;
      varying float vEnd, vSide, vTint, vFade;
      void main() {
        float alpha = pow(1.0 - abs(vSide), 0.75) * (1.0 - vEnd * 0.85) * vFade * uOpacity;
        vec3 base = vTint < 0.70 ? uWhite : vTint < 0.95 ? uViolet : uWarm * 0.3;
        vec3 color = mix(base, uWarm * (1.0 + uEnergy * 0.2), step(0.84, vTint) * uOrangeMix);
        gl_FragColor = vec4(color, alpha * 0.65);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const streaks = new THREE.Mesh(geometry, material); streaks.frustumCulled = false;
  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
  pointGeometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 4));
  const pointMaterial = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec4 aSeed;
      uniform float uCameraZ, uAdvance, uCollapse, uDepth;
      varying float vFade, vTint;
      void main() {
        float z = 2.0 - mod(2.0 - (aSeed.z - uCameraZ + uAdvance), uDepth);
        z = mix(z, -260.0, uCollapse);
        vec4 view = modelViewMatrix * vec4(aSeed.xy * (1.0 - uCollapse * 0.995), uCameraZ + z, 1.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp(75.0 / max(-view.z, 1.0), 1.0, 3.0);
        vFade = (1.0 - smoothstep(-6.0, 1.0, z)) * exp(-abs(z) * 0.0035);
        vTint = aSeed.w;
      }
    `,
    fragmentShader: `
      uniform float uOpacity, uOrangeMix;
      uniform vec3 uWhite, uViolet, uWarm;
      varying float vFade, vTint;
      void main() {
        float glow = max(0.0, 1.0 - length(gl_PointCoord - 0.5) * 2.0);
        vec3 base = vTint < 0.70 ? uWhite : vTint < 0.95 ? uViolet : uWarm * 0.3;
        gl_FragColor = vec4(mix(base, uWarm, step(0.84, vTint) * uOrangeMix), glow * vFade * uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const points = new THREE.Points(pointGeometry, pointMaterial); points.frustumCulled = false;
  const group = new THREE.Group(); group.add(streaks, points);
  return {
    group,
    update({ cameraZ, advance, length, energy, orangeMix = 0, collapse, opacity, density }) {
      uniforms.uCameraZ.value = cameraZ; uniforms.uAdvance.value = advance;
      uniforms.uOrangeMix.value = orangeMix; uniforms.uLength.value = length; uniforms.uEnergy.value = energy;
      uniforms.uCollapse.value = collapse; uniforms.uOpacity.value = opacity;
      geometry.instanceCount = Math.floor(count * Math.max(0, Math.min(density, 1)));
      pointGeometry.setDrawRange(0, geometry.instanceCount);
    },
    dispose() { geometry.dispose(); pointGeometry.dispose(); material.dispose(); pointMaterial.dispose(); },
  };
}
