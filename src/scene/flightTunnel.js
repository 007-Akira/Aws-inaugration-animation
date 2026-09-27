import * as THREE from 'three';

// Four translucent light rivers wrap the flight corridor. Their shared mesh is
// allocated once; the shader supplies slow flowing motion around the camera path.
export function createFlightTunnel() {
  const group = new THREE.Group();
  group.name = 'flight-tunnel';
  const positions = [], uvs = [], phases = [], indices = [];
  const segments = 280, cross = 8, depth = 1260;
  for (let ribbon = 0; ribbon < 4; ribbon++) {
    const offset = positions.length / 3;
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= cross; j++) {
        positions.push(0, 0, -8 - i / segments * depth);
        uvs.push(i / segments, j / cross);
        phases.push(ribbon * Math.PI / 2 + Math.PI / 4);
      }
    }
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < cross; j++) {
        const a = offset + i * (cross + 1) + j, b = a + cross + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
  geometry.setIndex(indices);
  const uniforms = {
    uBuild: { value: 0 }, uTime: { value: 0 }, uFade: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aPhase;
      uniform float uTime;
      varying vec2 vUv;
      varying float vDepth, vPhase;
      void main() {
        vUv = uv; vPhase = aPhase;
        float z = position.z, edge = uv.y * 2.0 - 1.0;
        float angle = aPhase + z * .0028 + sin(z * .009 + aPhase + uTime * .16) * .15;
        float width = .20 + .065 * sin(z * .014 - uTime * .24 + aPhase);
        angle += edge * width;
        float radius = 28.0 + sin(z * .012 + aPhase - uTime * .2) * 2.3;
        radius += edge * sin(z * .018 + uTime * .23 + aPhase) * 1.7;
        vec3 p = vec3(cos(angle) * radius, sin(angle) * radius * .72, z);
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        vDepth = -view.z;
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader: `
      uniform float uBuild, uTime, uFade;
      varying vec2 vUv;
      varying float vDepth, vPhase;
      void main() {
        float edge = abs(vUv.y * 2.0 - 1.0);
        float veil = pow(max(0.0, 1.0 - edge), 1.6);
        float waves = sin(vUv.x * 90.0 - uTime * .38 + vPhase);
        float threads = pow(max(0.0, .5 + .5 * sin(vUv.y * 86.0 + waves * 2.2)), 12.0);
        float filament = exp(-pow((vUv.y - .48 - waves * .07) * 38.0, 2.0));
        float flow = .76 + .24 * sin(vUv.x * 65.0 - uTime * .65 + vPhase);
        float depthFade = smoothstep(3.0, 24.0, vDepth) * exp(-max(0.0, vDepth) * .0025);
        float tip = smoothstep(0.0, .018, vUv.x) * (1.0 - smoothstep(.88, 1.0, vUv.x));
        float tint = .5 + .5 * sin(vUv.y * 5.0 + vUv.x * 12.0 + vPhase);
        vec3 color = mix(vec3(.32, .075, .95), vec3(.75, .07, .43), tint * .65);
        color = mix(color, vec3(.64, .40, 1.0), filament * .6);
        float alpha = veil * (.28 + threads * .3 + filament * .22);
        gl_FragColor = vec4(color * 1.35, alpha * flow * depthFade * tip * uBuild * uFade);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const ribbons = new THREE.Mesh(geometry, material);
  ribbons.frustumCulled = false; // Vertex shader places the light rivers around the path.
  group.add(ribbons);
  return {
    group,
    update(build, time, collapse) {
      uniforms.uBuild.value = THREE.MathUtils.smoothstep(build, .08, .7);
      uniforms.uTime.value = time;
      uniforms.uFade.value = 1 - THREE.MathUtils.smoothstep(collapse, 0, .8);
      group.visible = build > .08 && collapse < .8;
    },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
