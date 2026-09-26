import { actTwoTiming, cameraDistance, universeConfig } from '../config/actTwo';

// Include convergence motion when finding the nearest camera approach.
export function createFlybyCues() {
  return universeConfig.heroes.map(([, [x,y,z]], index) => {
    let closest = 0, minimum = Infinity;
    const convergenceStart = actTwoTiming.flyDuration - actTwoTiming.convergenceDuration;
    for (let i=0; i<=1650; i++) {
      const t=i*actTwoTiming.flyDuration/1650;
      const collapse=t<=convergenceStart ? 0 : ((t-convergenceStart)/actTwoTiming.convergenceDuration)**3;
      const distance=(x*x+y*y)*(1-collapse*.97)**2+(z+cameraDistance(t)-collapse*240)**2;
      if (distance<minimum) { minimum=distance; closest=t; }
    }
    const rate=.94+((index*37+11)%101)/100*.12;
    return { at:closest-.7/rate, closest, rate, gain:.19+((index*19+7)%31)/1000,
      pan:Math.sign(x)*Math.min(.75,.3+Math.abs(x)/40) };
  }).sort((a,b)=>a.at-b.at);
}

export class FlybyAudio {
  constructor(report=console.warn) {
    this.report=report; this.cues=createFlybyCues(); this.voices=new Set(); this.active=false; this.next=0;
  }
  async prepare(data) {
    this.context=new (window.AudioContext || window.webkitAudioContext)();
    this.bus=this.context.createGain(); this.bus.gain.value=.85; this.bus.connect(this.context.destination);
    this.buffer=await this.context.decodeAudioData(data.slice(0));
  }
  start() {
    this.reset();
    if (!this.buffer) return;
    this.active=true;
    // Called directly within the inauguration gesture; no timer or async unlock delay.
    void this.context.resume().catch(this.report);
  }
  update(time) {
    if (!this.active) return;
    if (time>=actTwoTiming.flyDuration) { this.reset(); return; }
    if (this.context.state!=='running') return;
    while (this.next<this.cues.length && this.cues[this.next].at<=time) {
      const cue=this.cues[this.next++];
      const offset=Math.max(0,time-cue.at)*cue.rate;
      const duration=Math.min((this.buffer.duration-offset)/cue.rate,actTwoTiming.flyDuration-time);
      if (duration<=.02) continue;
      const ctx=this.context, now=ctx.currentTime;
      const source=ctx.createBufferSource(), gain=ctx.createGain(), pan=ctx.createStereoPanner();
      source.buffer=this.buffer; source.loop=false; source.playbackRate.value=cue.rate; pan.pan.value=cue.pan;
      gain.gain.setValueAtTime(0,now); gain.gain.linearRampToValueAtTime(cue.gain,now+Math.min(.008,duration/4));
      gain.gain.setValueAtTime(cue.gain,now+duration-Math.min(.08,duration/3)); gain.gain.linearRampToValueAtTime(0,now+duration);
      source.connect(gain); gain.connect(pan); pan.connect(this.bus);
      const voice={source,gain,pan}; this.voices.add(voice);
      source.onended=()=>{source.disconnect();gain.disconnect();pan.disconnect();this.voices.delete(voice);};
      // Offset compensates late frames instead of playing missed transients late.
      source.start(now,offset); source.stop(now+duration);
    }
    this.bus.gain.setTargetAtTime(.85/Math.sqrt(Math.max(1,this.voices.size)),this.context.currentTime,.04);
  }
  reset() {
    this.active=false; this.next=0;
    for (const voice of this.voices) {
      voice.source.onended=null;
      try { voice.source.stop(); } catch { /* Already ended. */ }
      voice.source.disconnect(); voice.gain.disconnect(); voice.pan.disconnect();
    }
    this.voices.clear();
    if (this.context) { this.bus.gain.cancelScheduledValues(this.context.currentTime); this.bus.gain.value=.85; }
  }
  dispose() { this.reset(); void this.context?.close(); }
}
