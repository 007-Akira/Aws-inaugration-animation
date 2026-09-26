export class AssetLoader {
  constructor(manifest, { timeout = 15000, onProgress = () => {} } = {}) {
    if (new Set(manifest.map((asset) => asset.id)).size !== manifest.length) throw new Error('Asset IDs must be unique');
    this.manifest = manifest;
    this.timeout = timeout;
    this.onProgress = onProgress;
    this.assets = new Map();
    this.failed = [];
    this.settled = 0;
  }
  get summary() { return { total: this.manifest.length, loaded: this.assets.size, settled: this.settled, failed: this.failed.length }; }
  get(id) { return this.assets.get(id); }
  async load() {
    await Promise.all(this.manifest.map(async (asset) => {
      try { this.assets.set(asset.id, await this.loadOne(asset)); }
      catch (error) { this.failed.push({ ...asset, error: error.message }); }
      finally { this.settled++; this.onProgress(this.summary); }
    }));
    return { ready: !this.failed.some((asset) => asset.critical), failed: this.failed };
  }
  loadOne(asset) {
    return new Promise((resolve, reject) => {
      if (!['image', 'audio', 'video'].includes(asset.type)) { reject(new Error(`Unsupported asset type: ${asset.type}`)); return; }
      const element = asset.type === 'image' ? new Image() : document.createElement(asset.type);
      const event = asset.type === 'image' ? 'load' : 'loadeddata';
      let timer;
      const finish = (error) => {
        clearTimeout(timer);
        element.removeEventListener(event, success);
        element.removeEventListener('error', failure);
        if (error) {
          element.removeAttribute('src');
          if (asset.type !== 'image') element.load();
          reject(error);
        } else resolve(element);
      };
      const success = () => finish();
      const failure = () => finish(new Error(`Unable to load ${asset.id}`));
      element.addEventListener(event, success, { once: true });
      element.addEventListener('error', failure, { once: true });
      timer = setTimeout(() => finish(new Error(`Timed out loading ${asset.id}`)), this.timeout);
      if (asset.type !== 'image') element.preload = 'auto';
      element.src = asset.src;
      if (asset.type !== 'image') element.load();
    });
  }
}
