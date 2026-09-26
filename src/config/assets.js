// Paths are relative to public/. Local URLs also work when built under a subpath.
const localAsset = (path) => `${import.meta.env.BASE_URL}assets/${path}`;
export const assetManifest = [
  { id: 'curtain', type: 'image', src: localAsset('images/curtain-reference.jpg'), critical: true },
  // { id: 'intro', type: 'video', src: localAsset('video/intro.mp4'), critical: true },
  // { id: 'logo', type: 'image', src: localAsset('logos/logo.png'), critical: true },
];
export { localAsset };
