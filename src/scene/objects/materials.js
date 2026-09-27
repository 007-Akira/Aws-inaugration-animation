import * as THREE from 'three';
export function createObjectMaterials() {
  const standard = values => new THREE.MeshStandardMaterial(values);
  return {
    darkMetal: standard({color:0x242a34,metalness:.78,roughness:.3,emissive:0x09030f,emissiveIntensity:.25}),
    darkMetalSoft: standard({color:0x343c49,metalness:.65,roughness:.38}),
    purpleEmissive: standard({color:0x514d70,emissive:0x756aaf,emissiveIntensity:.65,metalness:.25,roughness:.18}),
    magentaEmissive: standard({color:0x584658,emissive:0x926883,emissiveIntensity:.45,metalness:.2,roughness:.2}),
    whiteEmissive: standard({color:0xe8eaf2,emissive:0xd8d9ff,emissiveIntensity:.7,metalness:.35,roughness:.2}),
    orangeEmissive: standard({color:0x7c2d12,emissive:0xff9900,emissiveIntensity:1.1,metalness:.2,roughness:.18}),
    // One shared transmission material; renderer transmission resolution is capped.
    smokedGlass: new THREE.MeshPhysicalMaterial({color:0x344353,transparent:true,opacity:.7,transmission:.4,thickness:.8,roughness:.18,metalness:.15,clearcoat:1,clearcoatRoughness:.08,ior:1.45,depthWrite:false}),
    wireWhite: new THREE.LineBasicMaterial({color:0x9eaeba,transparent:true,opacity:.35}),
    wirePurple: new THREE.LineBasicMaterial({color:0x858497,transparent:true,opacity:.28}),
  };
}
