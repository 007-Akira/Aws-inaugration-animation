import * as THREE from 'three';
import { seededRandom } from './objects';
import { finalConfig } from '../config/final';

export function createFinalScene(targets) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x010103);
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 150); camera.position.z = 24;
  const geometries = new Set(), materials = new Set();
  const geo = g => { geometries.add(g); return g; };
  const mat = m => { materials.add(m); return m; };
  const clock = { value: 0 }, reveal = { value: 0 }, intensity = { value: 1 }, pixelRatio = { value: 1 };
  const random = seededRandom(64823);
  const additive = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false };
  const planeVertex = `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  const atmosphere = new THREE.Mesh(geo(new THREE.PlaneGeometry(90, 55)), mat(new THREE.ShaderMaterial({
    ...additive, uniforms: { uTime: clock }, vertexShader: planeVertex,
    fragmentShader: `varying vec2 vUv; uniform float uTime;
    void main(){vec2 p=(vUv-.5)*2.;float t=uTime*.035;
      float field=sin(p.x*5.+sin(p.y*7.+t))*sin(p.y*4.-t*.71);
      float haze=pow(.5+.5*field,3.)*.026*exp(-dot(p,p)*2.);
      gl_FragColor=vec4(.24,.075,.42,haze);
      #include <colorspace_fragment>
    }`,
  }))); atmosphere.position.z = -20; scene.add(atmosphere);

  // Paths are sampled once. The vertex shader bends their centerlines and twists
  // cross-sections continuously; nearby strands share the same base geometry.
  const paths = [
    [[-10,17,-3],[-8,11,-2],[-7,6,-1],[-4,3,-3],[0,0,-6],[4,-5,-3],[5,-11,0],[10,-17,1]],
    [[24,7,-5],[17,9,-3],[12,12,-2],[7,11,-4],[4,8,-5],[2,4,-7],[0,1,-8]],
    [[-24,-2,2],[-16,-5,1],[-11,-9,-1],[-6,-8,-2],[-3,-5,-4],[0,-1,-7]],
    [[-3,17,-10],[-4,10,-7],[-2,6,-5],[1,2,-7],[3,-3,-6],[7,-8,-4],[8,-15,-2]],
  ];
  function ribbonGeometry(path) {
    const curve = new THREE.CatmullRomCurve3(path.map(p => new THREE.Vector3(...p)));
    const segments = 160, cross = 8, positions = [], normals = [], uvs = [], indices = [];
    for (let i = 0; i <= segments; i++) {
      const u = i / segments, p = curve.getPointAt(u), tangent = curve.getTangentAt(u);
      const side = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
      for (let j = 0; j <= cross; j++) { positions.push(p.x,p.y,p.z); normals.push(side.x,side.y,side.z); uvs.push(u,j/cross); }
    }
    for (let i=0;i<segments;i++)for(let j=0;j<cross;j++){const a=i*(cross+1)+j,b=a+cross+1;indices.push(a,b,a+1,b,b+1,a+1);}
    const g = geo(new THREE.BufferGeometry()); g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    g.setAttribute('aSide',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);
    return g;
  }
  const ribbonVertex = `attribute vec3 aSide; varying vec2 vUv; varying vec3 vWorld;
    uniform float uTime,uWidth,uOffset,uPhase,uSpeed,uIntensity;
    void main(){vUv=uv;float t=uTime*uSpeed;float u=uv.x;float edge=uv.y*2.-1.;
      vec3 p=position;float envelope=sin(u*3.14159);
      p.x+=(sin(u*9.+t+uPhase)*.5+sin(u*17.-t*.63+uPhase)*.15)*envelope*uIntensity;
      p.y+=sin(u*11.-t*.81+uPhase)*.44*envelope*uIntensity;
      p.z+=sin(u*8.+t*.73+uPhase)*.7;
      float twist=sin(u*10.-t*.52+uPhase);
      p+=aSide*(edge*uWidth*(.48+.52*abs(twist))+uOffset+sin(u*15.+t)*.08);
      p.z+=edge*uWidth*twist*.7;vWorld=p;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
  const ribbonFragment = `varying vec2 vUv;varying vec3 vWorld;uniform float uTime,uPhase,uOpacity,uIntensity;uniform vec3 uColor;
    void main(){float across=abs(vUv.y*2.-1.);float veil=pow(max(0.,1.-across),1.9);
      float thread=pow(.5+.5*sin(vUv.y*96.+sin(vUv.x*15.-uTime*.16+uPhase)*2.),12.);
      float flow=.7+.3*sin(vUv.x*24.-uTime*.35+uPhase);
      float tip=smoothstep(0.,.07,vUv.x)*(1.-smoothstep(.92,1.,vUv.x));
      float titleSpace=1.-.78*exp(-vWorld.x*vWorld.x/65.-vWorld.y*vWorld.y/11.);
      float alpha=(veil*.53+thread*.25)*tip*flow*uOpacity*titleSpace*(.8+.2*uIntensity);
      gl_FragColor=vec4(uColor,alpha);
      #include <colorspace_fragment>
    }`;
  paths.forEach((path,i) => {
    const g = ribbonGeometry(path);
    const strands = [[2.2,0,0x703bcf,.65],[.20,.47,0xa17aff,.75],[.72,-.68,0xb640a8,.48],[3.0,.08,0x6030a8,.16]];
    strands.forEach(([width,offset,color,opacity],j) => {
      const m=mat(new THREE.ShaderMaterial({ ...additive, side: THREE.DoubleSide,
        uniforms:{uTime:clock,uIntensity:intensity,uWidth:{value:width},uOffset:{value:offset},uPhase:{value:i*1.6+j*.21},uSpeed:{value:Math.PI*2/(13+i*2.3)},uOpacity:{value:opacity},uColor:{value:new THREE.Color(color)}},vertexShader:ribbonVertex,fragmentShader:ribbonFragment}));
      const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;scene.add(mesh);
    });
    for(let j=0;j<2;j++){
      const m=mat(new THREE.ShaderMaterial({...additive,side:THREE.DoubleSide,
        uniforms:{uTime:clock,uIntensity:intensity,uWidth:{value:.34+j*.3},uOffset:{value:1.1+j*.5},uPhase:{value:i*2.1+j},uSpeed:{value:Math.PI*2/(21+i*2.1)},uOpacity:{value:.09},uColor:{value:new THREE.Color(0x8451cc)}},vertexShader:ribbonVertex,fragmentShader:ribbonFragment}));
      const mesh=new THREE.Mesh(g,m);mesh.position.z=-5;mesh.frustumCulled=false;scene.add(mesh);
    }
  });

  const particleFragment = `varying vec3 vColor;varying float vAlpha;
    void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float glow=exp(-d*d*4.)*(1.-smoothstep(.5,1.,d));gl_FragColor=vec4(vColor,glow*vAlpha);
    #include <colorspace_fragment>
    }`;
  function particleLayer(count,foreground=false) {
    const p=[],seed=[],colors=[];
    for(let i=0;i<count;i++){
      p.push((random()-.5)*(foreground?36:68),(random()-.5)*(foreground?22:40),foreground?3+random()*6:-4-random()*35);
      seed.push(random()*6.28,random(),random());
      const n=random(), c=new THREE.Color(n<.7?0x8c56d8:n<.9?0xe2ddf5:n<.98?0xc550b9:0xf1b174);colors.push(c.r,c.g,c.b);
    }
    const g=geo(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('aSeed',new THREE.Float32BufferAttribute(seed,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    const m=mat(new THREE.ShaderMaterial({...additive,vertexColors:true,uniforms:{uTime:clock,uReveal:reveal,uIntensity:intensity,uDpr:pixelRatio},fragmentShader:particleFragment,
      vertexShader:`attribute vec3 aSeed;varying vec3 vColor;varying float vAlpha;uniform float uTime,uReveal,uIntensity,uDpr;
      void main(){float t=uTime;vec3 p=position;
        p.x+=sin(t*(.045+aSeed.y*.035)+aSeed.x)*(.35+aSeed.z)*uIntensity;
        p.y+=cos(t*(.031+aSeed.z*.04)+aSeed.x*2.)*.7*uIntensity;
        p.z+=sin(t*.05+aSeed.x)*.6;
        p.xy+=vec2(sin(t*.42+aSeed.x),cos(t*.31+aSeed.x))*pow(.5+.5*sin(t*.23+aSeed.x),16.)*.12;
        vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp((90.+aSeed.y*140.)/-mv.z,1.5,6.)*uDpr;
        vColor=mix(vec3(1.,.43,.15),color,smoothstep(0.,2.,uReveal));
        vAlpha=(.28+.42*pow(.5+.5*sin(t*.6+aSeed.x),2.))*(.7+.3*uIntensity);}`
    }));const points=new THREE.Points(g,m);points.frustumCulled=false;scene.add(points);
  }
  particleLayer(finalConfig.backgroundParticles);particleLayer(finalConfig.foregroundParticles,true);

  const core= new THREE.Mesh(geo(new THREE.PlaneGeometry(6,6)),mat(new THREE.ShaderMaterial({...additive,
    uniforms:{uTime:clock,uReveal:reveal},vertexShader:planeVertex,
    fragmentShader:`varying vec2 vUv;uniform float uTime,uReveal;void main(){vec2 p=(vUv-.5)*2.;float r=length(p);
      float intro=1.-smoothstep(0.,2.7,uReveal);float breath=1.+sin(uTime*.31)*.025;
      float light=exp(-r*r*100.)*.8+exp(-r*r*15.)*.13;
      vec3 tint=mix(vec3(1.,.50,.19),vec3(.74,.56,1.),smoothstep(0.,2.,uReveal));
      vec3 warm=vec3(1.,.83,.63)*exp(-r*r*230.)*.26;
      gl_FragColor=vec4(tint*light+warm,(.28+intro*.72)*breath*(1.-smoothstep(.7,1.,r)));
      #include <colorspace_fragment>
    }`
  })));core.position.set(0,0,-2);scene.add(core);

  const origins=[],destinations=[],seeds=[];
  for(let i=0;i<finalConfig.attractionParticles;i++){
    const line=i%3,list=targets[line],target=list[Math.floor(random()*list.length)];
    origins.push((random()-.5)*36,(random()-.5)*22,random()*6);destinations.push(...target);seeds.push(random()*6.28,random(),random());
  }
  const attractionGeo=geo(new THREE.BufferGeometry());attractionGeo.setAttribute('position',new THREE.Float32BufferAttribute(origins,3));attractionGeo.setAttribute('aTarget',new THREE.Float32BufferAttribute(destinations,3));attractionGeo.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,3));
  const attraction=new THREE.Points(attractionGeo,mat(new THREE.ShaderMaterial({...additive,
    uniforms:{uReveal:reveal,uDpr:pixelRatio},fragmentShader:particleFragment,
    vertexShader:`attribute vec3 aTarget,aSeed;uniform float uReveal,uDpr;varying vec3 vColor;varying float vAlpha;
      void main(){float start=aTarget.z<.5?0.:aTarget.z<1.5?2.4:3.7;float end=aTarget.z<.5?2.9:aTarget.z<1.5?3.65:4.9;
        float p=smoothstep(start+aSeed.y*.55,end-.25,uReveal);
        vec4 from=projectionMatrix*modelViewMatrix*vec4(position,1.);from/=from.w;
        vec2 destination=aTarget.xy;vec2 curl=vec2(sin(uReveal*1.6+aSeed.x),cos(uReveal*1.3+aSeed.x))*.09*sin(p*3.14159);
        gl_Position=vec4(mix(from.xy,destination,p)+curl,0.,1.);gl_PointSize=(1.5+aSeed.z*2.)*uDpr;
        vColor=mix(vec3(.57,.27,1.),vec3(.94,.88,1.),p);
        vAlpha=smoothstep(start,start+.5,uReveal)*(1.-smoothstep(end-.3,end+.3,uReveal))*(.4+.6*p);}`
  })));attraction.frustumCulled=false;scene.add(attraction);

  // Residual sparks disperse from the preceding orange-white convergence.
  const sparkGeo=geo(new THREE.BufferGeometry()),sparkPositions=[],sparkSeeds=[];
  for(let i=0;i<80;i++){sparkPositions.push(0,0,0);sparkSeeds.push(random()*6.283,random(),random());}
  sparkGeo.setAttribute('position',new THREE.Float32BufferAttribute(sparkPositions,3));sparkGeo.setAttribute('aSeed',new THREE.Float32BufferAttribute(sparkSeeds,3));
  const sparks=new THREE.Points(sparkGeo,mat(new THREE.ShaderMaterial({...additive,uniforms:{uTime:clock,uReveal:reveal,uDpr:pixelRatio},fragmentShader:particleFragment,
    vertexShader:`attribute vec3 aSeed;uniform float uTime,uReveal,uDpr;varying vec3 vColor;varying float vAlpha;
    void main(){float age=uReveal<3.?uReveal:mod(uTime*.12+aSeed.y*7.,7.);float distance=age*(.5+aSeed.z*2.4);
      vec3 p=vec3(cos(aSeed.x)*distance,sin(aSeed.x)*distance*.7,-2.+aSeed.z*2.);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      gl_PointSize=(1.+aSeed.y*1.8)*uDpr;vColor=mix(vec3(1.,.49,.16),vec3(.77,.61,1.),smoothstep(0.,2.,uReveal)*.86);
      vAlpha=exp(-age*1.8)*(uReveal<3.?1.:.1);}`
  })));sparks.frustumCulled=false;scene.add(sparks);

  return { scene,camera,
    update(time,dpr=1,reduced=false) {
      clock.value=reduced?0:time;reveal.value=time;pixelRatio.value=dpr;
      const calm=THREE.MathUtils.smoothstep(time,finalConfig.calmAfter,finalConfig.calmAfter+4);
      const dip=1-.5*Math.exp(-(((time-3.95)/.22)**2));
      intensity.value=(1-calm*.52)*dip;
      core.scale.setScalar(1+(Math.sin(Math.min(time/2.3,1)*Math.PI)*1.3));
      attraction.visible=time<5.3;
      camera.position.set(reduced?0:Math.sin(time*.12)*.075,reduced?0:Math.sin(time*.095)*.045,24);
      camera.rotation.z=reduced?0:Math.sin(time*.065)*.0007;
    },
    dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());scene.clear();},
  };
}
