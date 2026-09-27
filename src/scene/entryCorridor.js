import * as THREE from 'three';

// A sparse, suspended data corridor is visible through the curtains. It shares
// Act II's camera/world space, so the viewer physically passes through its paths.
export function createEntryCorridor() {
  const group = new THREE.Group(); group.name = 'entry-corridor';
  const positions = [], orders = [], nodes = [], nodeOrders = [];
  for (let arm = 0; arm < 6; arm++) {
    const angle = arm / 6 * Math.PI * 2 + Math.PI / 6;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(angle)*27, Math.sin(angle)*18, -18),
      new THREE.Vector3(Math.cos(angle+.13)*19, Math.sin(angle+.13)*13, -70),
      new THREE.Vector3(Math.cos(angle-.1)*15, Math.sin(angle-.1)*10, -155),
      new THREE.Vector3(Math.cos(angle)*12, Math.sin(angle)*8, -310),
    ]);
    for(let i=0;i<80;i++) {
      const a=curve.getPoint(i/80), b=curve.getPoint((i+1)/80);
      positions.push(a.x,a.y,a.z,b.x,b.y,b.z);
      orders.push(.12+(1-i/80)*.42,.12+(1-(i+1)/80)*.42);
      if(i%10===0){nodes.push(a.x,a.y,a.z);nodeOrders.push(.12+(1-i/80)*.42);}
    }
  }
  const uniforms = { uBuild:{value:0},uTime:{value:0},uFade:{value:1},uDpr:{value:1} };
  const vertexShader = `attribute float aOrder;uniform float uBuild,uTime,uDpr;varying float vAlpha,vDepth;
    void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
      vDepth=-mv.z;vAlpha=smoothstep(aOrder,aOrder+.24,uBuild);
      gl_PointSize=clamp(190./max(1.,-mv.z),2.,5.)*uDpr;}`;
  function geometry(p,o){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('aOrder',new THREE.Float32BufferAttribute(o,1));return g;}
  const linesGeometry=geometry(positions,orders),nodesGeometry=geometry(nodes,nodeOrders);
  const lineMaterial=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader,
    fragmentShader:`uniform float uTime,uFade;varying float vAlpha,vDepth;
      void main(){float packet=pow(.5+.5*sin(vDepth*.095+uTime*.65),18.);
      float depth=exp(-vDepth*.006)*smoothstep(0.,12.,vDepth);
      gl_FragColor=vec4(.38,.45,.55,vAlpha*uFade*depth*(.08+packet*.16));}`});
  const nodeMaterial=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader,
    fragmentShader:`uniform float uFade;varying float vAlpha,vDepth;
      void main(){float r=length(gl_PointCoord-.5)*2.;float light=exp(-r*r*4.);
      gl_FragColor=vec4(.63,.72,.84,vAlpha*uFade*light*exp(-vDepth*.004)*smoothstep(0.,12.,vDepth));}`});
  group.add(new THREE.LineSegments(linesGeometry,lineMaterial),new THREE.Points(nodesGeometry,nodeMaterial));
  return {group,update(build,time,collapse,dpr){uniforms.uBuild.value=build;uniforms.uTime.value=time;uniforms.uFade.value=(1-collapse)*(1-THREE.MathUtils.smoothstep(time,0,2));uniforms.uDpr.value=dpr;group.visible=build>0;},
    dispose(){linesGeometry.dispose();nodesGeometry.dispose();lineMaterial.dispose();nodeMaterial.dispose();}};
}
