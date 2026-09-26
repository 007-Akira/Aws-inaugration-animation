const NS = 'http://www.w3.org/2000/svg';
export const titleLines = [
  { text: 'AWS', family: 'TitleSans', weight: 300, y: 416, size: 120, spacing: 9, start: 2.15, finish: 2.9 },
  { text: 'STUDENT BUILDER GROUP', family: 'TitleSans', weight: 500, y: 493, size: 48, spacing: 5, start: 2.95, finish: 3.65 },
  { text: 'TKMCE', family: 'TitleSerif', weight: 400, y: 722, size: 270, spacing: 4, start: 3.9, finish: 4.9 },
];
const clamp = x => Math.max(0, Math.min(1, x));
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };

// Independent live text. Canvas is used only to sample particle destinations.
export function createFinalTitle() {
  const root = document.createElement('div'); root.id = 'final-title'; root.className = 'final-title layer';
  root.hidden = true; root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `<svg viewBox="0 0 1920 1080" xmlns="${NS}"><defs>
    <linearGradient id="final-edge-light"><stop stop-color="#ba7aff" stop-opacity="0"/><stop offset=".5" stop-color="#d9bfff" stop-opacity=".65"/><stop offset="1" stop-color="#ba7aff" stop-opacity="0"/></linearGradient>
    <linearGradient id="final-impact-light"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#faf2ff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    ${titleLines.map((_,i)=>`<clipPath id="final-clip-${i}"><rect x="960" y="0" width="0" height="1080"/></clipPath>`).join('')}
    <clipPath id="final-outline-clip"><rect x="960" y="0" width="0" height="1080"/></clipPath>
    </defs>
    <rect class="title-anticipation" width="1920" height="1080" fill="#000" opacity="0"/>
    ${titleLines.map((line,i)=>`<g data-title-line="${i}" font-family="${line.family}" font-weight="${line.weight}">
      <text class="title-outline" ${i===2?'clip-path="url(#final-outline-clip)"':''} x="960" y="${line.y}" text-anchor="middle">${line.text}</text>
      <text class="title-solid" clip-path="url(#final-clip-${i})" x="960" y="${line.y}" text-anchor="middle">${line.text}</text>
      ${i===2?`<text class="title-edge" x="960" y="${line.y}" text-anchor="middle">${line.text}</text><text class="title-impact" fill="url(#final-impact-light)" x="960" y="${line.y}" text-anchor="middle" opacity="0">${line.text}</text>`:''}</g>`).join('')}
    <rect class="title-sweep" x="960" y="453" width="2" height="45" fill="#e7d5ff" opacity="0"/>
    <rect class="title-underline" x="960" y="766" width="0" height="1" fill="#d9c2f5"/>
    </svg>`;
  document.querySelector('#stage').append(root);
  const groups=[...root.querySelectorAll('[data-title-line]')],outlines=[...root.querySelectorAll('.title-outline')];
  const clips=titleLines.map((_,i)=>root.querySelector(`#final-clip-${i} rect`));
  const outlineClip=root.querySelector('#final-outline-clip rect'),sweep=root.querySelector('.title-sweep');
  const underline=root.querySelector('.title-underline'),anticipation=root.querySelector('.title-anticipation');
  const edge=root.querySelector('.title-edge'),gradient=root.querySelector('#final-edge-light');
  const impact=root.querySelector('.title-impact'),impactGradient=root.querySelector('#final-impact-light');
  const widths=[270,680,934];
  let lastTime=-1,lastEdgeTime=-1;
  async function prepare() {
    for(const line of titleLines){
      const font=`${line.weight} ${line.size}px ${line.family}`;
      await document.fonts.load(font);
      if(!document.fonts.check(font))throw new Error(`Local title font unavailable: ${line.family}`);
    }
    const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;
    const ctx=canvas.getContext('2d',{willReadFrequently:true}),targets=[];
    titleLines.forEach((line,i)=>{
      groups[i].setAttribute('font-size',line.size);groups[i].setAttribute('letter-spacing',line.spacing);
      groups[i].querySelectorAll('text').forEach(text=>text.setAttribute('x',960+line.spacing/2));
      ctx.font=`${line.weight} ${line.size}px ${line.family}`;ctx.letterSpacing=`${line.spacing}px`;
      let width=ctx.measureText(line.text).width-line.spacing;
      // Uniform type sizing inside the existing cover-scaled stage; never stretch glyphs.
      if(width>1000){line.size*= (1000-(line.text.length-1)*line.spacing)/(width-(line.text.length-1)*line.spacing);groups[i].setAttribute('font-size',line.size);ctx.font=`${line.weight} ${line.size}px ${line.family}`;width=ctx.measureText(line.text).width-line.spacing;}
      widths[i]=width;
      ctx.clearRect(0,0,1920,1080);ctx.fillStyle='white';ctx.fillText(line.text,(1920-width)/2,line.y);
      const pixels=ctx.getImageData(0,0,1920,1080).data,points=[];
      for(let y=Math.floor(line.y-line.size);y<line.y;y+=3)for(let x=400;x<1520;x+=3){if(pixels[(y*1920+x)*4+3]>80)points.push([x/960-1,1-y/540,i]);}
      targets.push(points);
    });
    canvas.width=canvas.height=1;return targets;
  }
  function fillClip(i,progress,center=false){const width=(widths[i]+12)*clamp(progress);clips[i].setAttribute('x',center?960-width/2:960-(widths[i]+12)/2);clips[i].setAttribute('width',width);}
  function update(time){
    if(time===lastTime)return;
    const reveal=time<6.5||lastTime<6.5;lastTime=time;
    const phase=time<2.15?'attraction':time<2.95?'aws':time<3.65?'subtitle':time<3.9?'anticipation':time<4.9?'tkmce':'resting';
    if(root.dataset.phase!==phase)root.dataset.phase=phase;
    if(reveal){
      const aws=smooth((time-2.15)/.75),subtitle=clamp((time-2.95)/.7),outline=smooth((time-3.9)/.8),solid=clamp((time-4.7)/.2);
      outlines[0].style.strokeDashoffset=String((1-aws)*700);outlines[0].style.opacity=String(smooth(aws*5)*(1-smooth((aws-.65)/.35)));
      fillClip(0,smooth((aws-.3)/.7));
      outlines[1].style.opacity='0';fillClip(1,subtitle);
      sweep.setAttribute('x',960-widths[1]/2+widths[1]*subtitle);sweep.style.opacity=String(Math.sin(subtitle*Math.PI)*.6);
      const extent=(widths[2]+12)*outline;outlineClip.setAttribute('x',960-extent/2);outlineClip.setAttribute('width',extent);
      outlines[2].style.strokeDashoffset=String((1-outline)*700);outlines[2].style.opacity=String(smooth(outline*5)*(1-solid));fillClip(2,solid);
      impact.style.opacity=String(Math.sin(solid*Math.PI)*.65);impactGradient.setAttribute('x1',`${solid*130-30}%`);impactGradient.setAttribute('x2',`${solid*130}%`);
      // Brief compositing dim for anticipation only; the approved environment is untouched.
      anticipation.setAttribute('opacity',.10*smooth((time-3.65)/.08)*(1-smooth((time-3.9)/.18)));
      const lineWidth=widths[2]*.42*smooth((time-4.9)/.6);underline.setAttribute('x',960-lineWidth/2);underline.setAttribute('width',lineWidth);
      underline.style.opacity=String(.12+.65*(1-smooth((time-5.4)/.8)));
      edge.style.opacity=time>=4.9?'.16':'0';
    }
    if(time-lastEdgeTime<.08&&lastEdgeTime>=0)return;lastEdgeTime=time;
    const x=((time*.045)%1.8)-.4;gradient.setAttribute('x1',`${x*100}%`);gradient.setAttribute('x2',`${(x+.18)*100}%`);
  }
  return{root,prepare,update,show(){root.hidden=false;},reset(){root.hidden=true;lastTime=lastEdgeTime=-1;update(0);},dispose(){root.remove();}};
}
