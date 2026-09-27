import * as THREE from 'three';

// An open spatial framework surrounds the existing flight route. Everything is
// authored once in world space; camera travel supplies the motion and parallax.
export function createFlightTunnel() {
  const group = new THREE.Group();
  group.name = 'flight-tunnel';
  const vertices = [], strengths = [];
  const depth = 1260, spacing = 45, segments = 96;
  function wall(z, angle) {
    const radius = 30 + Math.sin(z * .007) * 2;
    return [Math.cos(angle) * radius + Math.sin(z * .004) * 2,
      Math.sin(angle) * radius * .7 + Math.sin(z * .006) * 1.2, z];
  }
  function line(a, b, strength) {
    vertices.push(...a, ...b);
    strengths.push(strength, strength);
  }
  // Interrupted arch ribs imply depth without enclosing the star field in a cage.
  for (let z = -35; z > -depth; z -= spacing) {
    for (let segment = 0; segment < segments; segment++) {
      if (segment % 16 > 11) continue;
      const angle = segment / segments * Math.PI * 2;
      line(wall(z, angle), wall(z, angle + Math.PI * 2 / segments), .72);
    }
  }
  // Six long rails connect the ribs, giving every object a shared spatial setting.
  for (let rail = 0; rail < 6; rail++) {
    const angle = rail / 6 * Math.PI * 2 + Math.PI / 6;
    for (let z = -10; z > -depth; z -= 8) {
      line(wall(z, angle), wall(z - 8, angle), .36);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('aStrength', new THREE.Float32BufferAttribute(strengths, 1));
  const uniforms = {
    uBuild: { value: 0 }, uTime: { value: 0 }, uFade: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aStrength;
      varying float vDepth, vWorldZ, vStrength;
      void main() {
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        vDepth = -view.z; vWorldZ = position.z; vStrength = aStrength;
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader: `
      uniform float uBuild, uTime, uFade;
      varying float vDepth, vWorldZ, vStrength;
      void main() {
        float distanceFade = smoothstep(2.0, 26.0, vDepth) * exp(-max(0.0, vDepth) * .0036);
        float pulse = pow(max(0.0, .5 + .5 * sin(vWorldZ * .022 + uTime * .7)), 10.0);
        vec3 color = mix(vec3(.48, .59, .73), vec3(.57, .43, .82), pulse * .25);
        float alpha = uBuild * uFade * distanceFade * vStrength * (.42 + pulse * .22);
        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const framework = new THREE.LineSegments(geometry, material);
  group.add(framework);
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
