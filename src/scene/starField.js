import * as THREE from 'three';
import {seededRandom} from './objects';
import {universeConfig} from '../config/actTwo';
export function createStarField() {
  const group=new THREE.Group(),random=seededRandom(universeConfig.seed+313),layers=[];
  const uniforms={uTime:{value:0},uOpacity:{value:0},uDpr:{value:1},uOrange:{value:0},uCollapse:{value:0}};
  // The entrance layer fills the camera frustum instead of wasting most stars
  // outside the opening view. World-space positions give natural passing parallax.
  for(const [count,width,height,near,depth,size,entrance] of [[4600,1800,1000,260,2300,1.5],[2200,440,270,60,1500,2.2],[1800,0,0,90,850,2.1,true]]){
    const positions=[],colors=[],seeds=[];
    for(let i=0;i<count;i++){
      if(entrance){
        const z=near+random()*depth;
        const angle=random()*Math.PI*2, radius=.16+Math.sqrt(random())*1.12;
        positions.push(Math.cos(angle)*radius*z,Math.sin(angle)*radius*z*.5625,-z);
      } else positions.push((random()-.5)*width,(random()-.5)*height,-near-random()*depth);
      const n=random()*(entrance ? .72 : 1),color=new THREE.Color(n<.6?0xcbd8f3:n<.9?0x8657d8:n<.98?0xc550ad:0xcf7730);colors.push(color.r,color.g,color.b);seeds.push(random()*6.28,random(),n);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,3));
    const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,uniforms:{...uniforms,uSize:{value:size},uBrightness:{value:entrance ? 2.4 : 1}},
      vertexShader:`attribute vec3 aSeed;uniform float uTime,uDpr,uSize,uCollapse;varying vec3 vColor;varying float vAlpha,vWarm;
        void main(){vec3 p=position;p.xy+=vec2(sin(uTime*.07+aSeed.x),cos(uTime*.05+aSeed.x))*.5;p.xy*=1.-uCollapse*.98;
          vec4 view=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*view;gl_PointSize=clamp(uSize*(.7+aSeed.y)*sqrt(450./max(40.,-view.z)),1.,3.5)*uDpr;
          vColor=color;vWarm=aSeed.z;vAlpha=smoothstep(0.,35.,-view.z)*(.55+.25*sin(uTime*(.3+aSeed.y*.2)+aSeed.x))*exp(-max(0.,-view.z)*.00035);}`,
      fragmentShader:`uniform float uOpacity,uOrange,uBrightness;varying vec3 vColor;varying float vAlpha,vWarm;
        void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;vec3 c=mix(vColor,vec3(1.,.42,.09),uOrange*step(.87,vWarm));gl_FragColor=vec4(c*uBrightness,exp(-d*d*4.)*vAlpha*uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`});const points=new THREE.Points(geometry,material);points.frustumCulled=false;group.add(points);layers.push({geometry,material,count});
  }
  return {group,update({time,opacity,density,orangeMix,collapse,dpr}){uniforms.uTime.value=time;uniforms.uOpacity.value=opacity;uniforms.uDpr.value=dpr;uniforms.uOrange.value=orangeMix;uniforms.uCollapse.value=collapse;layers.forEach(l=>l.geometry.setDrawRange(0,Math.floor(l.count*Math.min(1,density))));},dispose(){layers.forEach(l=>{l.geometry.dispose();l.material.dispose();});}};
}
