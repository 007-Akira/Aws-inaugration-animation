export class VideoManager {
  constructor(element, report = console.warn) { this.element = element; this.report = report; this.available = false; this.generation = 0; }
  attach(asset) {
    if (!asset) return;
    // Use the already preloaded element instead of downloading the source twice.
    asset.id = this.element.id;
    asset.playsInline = true;
    asset.controls = false;
    asset.disablePictureInPicture = true;
    asset.setAttribute('aria-hidden', 'true');
    asset.tabIndex = -1;
    this.element.replaceWith(asset);
    this.element = asset;
    this.available = true;
  }
  async play({ muted = true } = {}) {
    if (!this.available) return false;
    const generation = ++this.generation;
    this.element.muted = muted;
    try {
      await this.element.play();
      if (generation !== this.generation) return false;
      this.element.style.visibility = 'visible';
      this.element.style.opacity = '1';
      return true;
    } catch (error) { if (generation === this.generation) this.report(error); return false; }
  }
  reset() {
    this.generation++;
    this.element.pause();
    if (this.element.readyState) this.element.currentTime = 0;
    this.element.style.visibility = 'hidden';
    this.element.style.opacity = '0';
  }
}
