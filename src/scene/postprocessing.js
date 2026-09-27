import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

// Keep postprocessing at most 1080p even when the presentation canvas is 4K.
export function createComposer(renderer,scene,camera,width,height) {
  const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType});
  // Avoid multisampled half-float resolves: support varies between presentation GPUs.
  // Smooth the final LDR image instead, without amplifying invalid edge samples in bloom.
  target.samples=0;
  const composer=new EffectComposer(renderer,target);composer.setPixelRatio(1);
  const renderPass=new RenderPass(scene,camera);
  const bloomPass=new UnrealBloomPass(new THREE.Vector2(1,1),.3,.5,1.15);
  const outputPass=new OutputPass();
  const antialiasPass=new ShaderPass(FXAAShader);
  composer.addPass(renderPass);composer.addPass(bloomPass);composer.addPass(outputPass);composer.addPass(antialiasPass);
  let dimensions='';
  function resize(w,h,pixelRatio=1){
    const scale=Math.min(pixelRatio,1920/w,1080/h);
    const x=Math.max(1,Math.round(w*scale)),y=Math.max(1,Math.round(h*scale));
    const key=`${x}:${y}`;if(key===dimensions)return;
    dimensions=key;composer.setSize(x,y);
    antialiasPass.uniforms.resolution.value.set(1/x,1/y);
  }
  resize(width,height,renderer.getPixelRatio());
  return {composer,bloomPass,resize,dispose(){renderPass.dispose();bloomPass.dispose();outputPass.dispose();antialiasPass.dispose();composer.dispose();}};
}
