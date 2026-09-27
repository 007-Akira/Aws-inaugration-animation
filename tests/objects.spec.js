import {test,expect} from '@playwright/test';

test('hero animation preserves flight transforms and releases owned resources',async({page})=>{
  await page.goto('/');await expect(page.locator('#stage')).toHaveAttribute('data-state','ready',{timeout:30000});
  const result=await page.evaluate(async()=>{
    const {createObjectLibrary}=await import('/src/scene/objects.js');
    const library=createObjectLibrary();
    const types=['network','compute','database','cloud','cube','serverless','neural','code'];
    const objects=types.map(type=>library.create(type));
    const geometries=new Set(),materials=new Set();
    for(const object of objects)object.traverse(n=>{if(n.geometry)geometries.add(n.geometry);if(n.material)materials.add(n.material);});
    let disposedGeometry=0,disposedMaterial=0;
    geometries.forEach(g=>g.addEventListener('dispose',()=>disposedGeometry++));materials.forEach(m=>m.addEventListener('dispose',()=>disposedMaterial++));
    objects.forEach(object=>{object.position.set(7,2,-150);object.rotation.set(.1,.3,.2);object.scale.setScalar(3);});
    const stable=objects.every(object=>{object.userData.update?.(1,1);object.userData.update?.(5,2);return object.position.equals({x:7,y:2,z:-150})&&object.rotation.y===.3&&object.scale.x===3;});
    const compute=objects[1],cloud=objects[3];
    const cloudIntensities=[];cloud.traverse(n=>{if(n.material?.emissiveIntensity)cloudIntensities.push(n.material.emissiveIntensity);});
    compute.userData.update(19,1);
    const after=[];cloud.traverse(n=>{if(n.material?.emissiveIntensity)after.push(n.material.emissiveIntensity);});
    library.dispose();
    return{stable,isolated:JSON.stringify(cloudIntensities)===JSON.stringify(after),geometries:geometries.size,materials:materials.size,disposedGeometry,disposedMaterial};
  });
  expect(result.stable).toBe(true);expect(result.isolated).toBe(true);
  expect(result.disposedGeometry).toBe(result.geometries);expect(result.disposedMaterial).toBe(result.materials);
});
