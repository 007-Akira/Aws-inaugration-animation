import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {seededRandom} from './objects';
import {universeConfig,entryTravel} from '../config/actTwo';

export const archetypes=['compute','database','cloud','network','cube','serverless','neural','code'];
export function createPopulationLayout() {
  const random=seededRandom(universeConfig.seed+91),midground=[],secondary=[];
  for(let i=0;i<40;i++) {
    const angle=(i%4)*Math.PI/2+.35+(random()-.5)*.5,depth=70+i*25+random()*20;
    const radius=17+random()*26+depth*.014;
    midground.push({type:archetypes[i%8],position:[Math.cos(angle)*radius,Math.sin(angle)*radius*.6,-depth-entryTravel],scale:2+random()*2.8,phase:random()*6.28,spin:.035+random()*.065,rank:random()});
  }
  for(let i=0;i<320;i++) {
    const angle=random()*Math.PI*2,depth=25+random()*1300,radius=13+random()*90+depth*.025;
    secondary.push({type:i%5,position:[Math.cos(angle)*radius,Math.sin(angle)*radius*.65,-depth-entryTravel],scale:.3+random()*1.4,phase:random()*6.28,spin:.06+random()*.12,rank:random()});
  }
  return {midground,secondary};
}
function archetypeGeometry(type) {
  const parts=[];
  function add(g,p=[0,0,0],rotation=null){if(rotation)g.rotateX(rotation);g.translate(...p);parts.push(g);}
  if(type==='compute'){add(new THREE.BoxGeometry(1.2,3.4,1));for(const x of [-.9,.9])add(new THREE.BoxGeometry(.45,3.1,.9),[x,0,0]);}
  if(type==='database'){for(const y of [-1,0,1])add(new THREE.CylinderGeometry(1,1,.35,12),[0,y,0]);add(new THREE.CylinderGeometry(.3,.3,2.8,8));}
  if(type==='cloud'){for(const [x,y,s] of [[-1,-.2,.9],[0,.35,1.1],[1,-.1,.85]])add(new THREE.IcosahedronGeometry(s,0),[x,y,0]);}
  if(type==='network'||type==='neural')add(new THREE.IcosahedronGeometry(1.6,type==='neural'?1:0));
  if(type==='cube'){add(new THREE.BoxGeometry(2.2,2.2,2.2));add(new THREE.BoxGeometry(1.2,1.2,1.2));}
  if(type==='serverless'){add(new THREE.TorusGeometry(1.65,.045,4,24));add(new THREE.TorusGeometry(1.4,.045,4,24),[0,0,0],Math.PI/2);add(new THREE.IcosahedronGeometry(.5,0));}
  if(type==='code'){add(new THREE.BoxGeometry(3,2,.05));for(let i=0;i<5;i++)add(new THREE.BoxGeometry(1.6+i%2*.4,.04,.04),[.15,.65-i*.3,.08]);}
  // Convert to unindexed geometry consistently before merging mixed primitives.
  const normalized=parts.map(g=>g.index?g.toNonIndexed():g);
  const merged=mergeGeometries(normalized);new Set([...normalized,...parts]).forEach(g=>g.dispose());return merged;
}
export function createPopulation() {
  const layout=createPopulationLayout(),group=new THREE.Group();group.name='layered-population';
  const resources=[],materials=[],batches=[],dummy=new THREE.Object3D();
  const color=new THREE.Color();
  function batch(geometry,entries,kind,type) {
    resources.push(geometry);
    const wire = type==='cloud'||type==='network'||type==='neural'||(kind==='secondary'&&type===0);
    const material=wire
      ? new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.22,depthWrite:false})
      : new THREE.MeshStandardMaterial({color:0x738292,metalness:.65,roughness:.38,emissive:0x171e2c,emissiveIntensity:.18,transparent:true,opacity:.8,depthWrite:false});
    materials.push(material);
    const mesh=new THREE.InstancedMesh(geometry,material,entries.length);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;
    entries.forEach((entry,i)=>{color.set(i%10<7?0x9baab9:i%10<9?0x7c809d:0x8a7c8c);mesh.setColorAt(i,color);});
    group.add(mesh);batches.push({mesh,entries,kind,type});
  }
  for(const type of archetypes) {
    const entries=layout.midground.filter(e=>e.type===type).map(e=>({...e,hero:false}));
    universeConfig.heroes.forEach(([name,position,scale,rotation,meta],index)=>{if(name===type)entries.push({type,position:[position[0],position[1],position[2]-entryTravel],scale,rotation,phase:index,spin:.05,rank:0,hero:true,index,meta});});
    batch(archetypeGeometry(type),entries,'midground',type);
  }
  const geometries=[new THREE.BoxGeometry(1,1,1),new THREE.OctahedronGeometry(1,0),new THREE.TorusGeometry(.8,.035,4,16),new THREE.BoxGeometry(.35,1.8,.35),new THREE.PlaneGeometry(1.4,.5)];
  geometries.forEach((geometry,i)=>batch(geometry,layout.secondary.filter(e=>e.type===i),'secondary',i));
  let visibleMidground=0,visibleSecondary=0;
  return {group,layout,
    update({time,flyTime=time,cameraZ,progress,emergence,collapse,tuning}) {
      visibleMidground=0;visibleSecondary=0;
      const density=.2+progress*.8;
      for(const {mesh,entries,kind} of batches) {
        mesh.visible=kind==='secondary'?tuning.showSecondary:(tuning.showHeroes||tuning.midgroundDensity>0);
        mesh.material.opacity=(mesh.material.wireframe?(kind==='secondary'?.16:.26):(kind==='secondary'?.5:.82))*emergence;
        entries.forEach((entry,i)=>{
          const [x,y,z]=entry.position,ahead=cameraZ-z;
          let enabled=kind==='secondary'?entry.rank<tuning.secondaryObjectDensity*density:entry.rank<tuning.midgroundDensity*(.45+progress*.55);
          if(entry.hero)enabled=tuning.showHeroes&&entry.index<Math.ceil(universeConfig.heroes.length*tuning.heroObjectDensity)&&(entry.meta.closePass===undefined||entry.meta.closePass<tuning.closePassCount)&&ahead>=125;
          const fade=THREE.MathUtils.smoothstep(ahead,-20,15)*(1-THREE.MathUtils.smoothstep(ahead,780,1100));
          if(enabled&&mesh.visible&&fade>.001){if(kind==='secondary')visibleSecondary++;else visibleMidground++;}
          dummy.position.set(x*(1-collapse*.97),y*(1-collapse*.97),z-collapse*240);
          if(entry.hero)dummy.rotation.set(entry.rotation[0],entry.rotation[1]+Math.sin((entry.type==='network'?time:flyTime)*.4+entry.index)*.045,entry.rotation[2]);
          else dummy.rotation.set(entry.phase*.2,entry.phase+time*entry.spin,entry.phase*.1);
          dummy.scale.setScalar(enabled?entry.scale*fade:0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
        });mesh.instanceMatrix.needsUpdate=true;
      }
    },
    get telemetry(){return {midground:visibleMidground,secondary:visibleSecondary,batches:batches.length};},
    dispose(){resources.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());batches.forEach(b=>b.mesh.dispose());group.clear();},
  };
}
