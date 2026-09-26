import { test, expect } from '@playwright/test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function files(path) { return readdirSync(path, { withFileTypes: true }).flatMap(item => item.isDirectory() ? files(join(path,item.name)) : [join(path,item.name)]); }

test('production source and assets contain no final reference image dependency', () => {
  expect(existsSync('public/assets/images/final-hero.png')).toBe(false);
  for (const file of files('src')) expect(readFileSync(file,'utf8')).not.toMatch(/final-hero\.png|finalHero|uImage|protectedBox/);
});

test('procedural final environment moves behind stable live text and resets without orphan draws', async ({ page }) => {
  const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('request',r=>requests.push(r.url()));
  await page.addInitScript(() => {
    window.drawCount=0;
    for(const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']) {
      const original=WebGL2RenderingContext.prototype[name];
      WebGL2RenderingContext.prototype[name]=function(...args){window.drawCount++;return original.apply(this,args);};
    }
  });
  await page.setViewportSize({width:1280,height:720});
  await page.goto('/?final=true');
  await expect(page.locator('#stage')).toHaveAttribute('data-state','complete',{timeout:30000});
  await expect(page.locator('#final-title')).toHaveAttribute('data-phase','resting');
  await expect(page.locator('.title-solid')).toHaveText(['AWS','STUDENT BUILDER GROUP','TKMCE']);
  const layout=()=>page.locator('.title-solid').evaluateAll(nodes=>nodes.map(node=>{const b=node.getBoundingClientRect();return [b.x,b.y,b.width,b.height];}));
  const before=await layout();
  const typography=await page.locator('.title-solid').evaluateAll(nodes=>nodes.map(node=>({family:getComputedStyle(node).fontFamily,weight:getComputedStyle(node).fontWeight,spacing:parseFloat(getComputedStyle(node).letterSpacing)})));
  expect(typography.map(t=>t.family)).toEqual(['TitleSans','TitleSans','TitleSerif']);
  expect(typography.map(t=>t.weight)).toEqual(['300','500','400']);
  expect(typography[2].spacing).toBeLessThanOrEqual(5);
  expect(before[2][2]/1280).toBeGreaterThan(.45);
  expect(before[2][2]/1280).toBeLessThan(.55);
  const pixels=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>{
    const canvas=document.querySelector('#effects-canvas'),gl=canvas.getContext('webgl2');
    const data=new Uint8Array(160*100*4);gl.readPixels(80,canvas.height-160,160,100,gl.RGBA,gl.UNSIGNED_BYTE,data);
    let hash=0;for(let i=0;i<data.length;i++)hash=Math.imul(hash^data[i],16777619);resolve(hash);
  })));
  const frame=await pixels();await page.waitForTimeout(1300);expect(await pixels()).not.toBe(frame);
  expect(await layout()).toEqual(before);
  for(const [width,height] of [[1920,1080],[1366,768],[1536,864],[2560,1440],[3840,2160],[1000,900]]){
    await page.setViewportSize({width,height});
    const scale=Math.max(width/1920,height/1080);
    await expect.poll(async () => (await page.locator('#final-title').boundingBox()).width).toBeCloseTo(1920*scale,0);
    expect((await page.locator('#final-title').boundingBox()).height).toBeCloseTo(1080*scale,0);
  }
  await page.setViewportSize({width:1280,height:720});
  await page.keyboard.press('d');
  for(let i=0;i<3;i++){
    await page.keyboard.press('r');await expect(page.locator('#final-title')).toBeHidden();
    await expect(page.locator('#stage')).toHaveAttribute('data-state','ready');
    await page.waitForTimeout(100);const count=await page.evaluate(()=>window.drawCount);
    await page.waitForTimeout(160);expect(await page.evaluate(()=>window.drawCount)).toBe(count);
    if(i<2){await page.locator('#debug-final').click();await expect(page.locator('#final-title')).toBeVisible();}
  }
  expect(requests.some(url=>url.includes('final-hero'))).toBe(false);expect(errors).toEqual([]);
});

test('real playback materializes title in order and emits a single impact hook', async ({page})=>{
  await page.setViewportSize({width:960,height:540});await page.goto('/?presentation=true');
  await expect(page.locator('#stage')).toHaveAttribute('data-state','ready',{timeout:30000});
  await page.evaluate(()=>{
    window.titlePhases=[];window.impacts=0;
    const title=document.querySelector('#final-title');
    new MutationObserver(()=>{const phase=title.dataset.phase;if(!window.titlePhases.includes(phase))window.titlePhases.push(phase);}).observe(title,{attributes:true,attributeFilter:['data-phase']});
    document.addEventListener('TKMCE_IMPACT',()=>window.impacts++);
  });
  await page.locator('#start-button').click();
  await expect(page.locator('#final-title')).toHaveAttribute('data-phase','resting',{timeout:35000});
  expect(await page.evaluate(()=>window.titlePhases)).toEqual(['attraction','aws','subtitle','anticipation','tkmce','resting']);
  expect(await page.evaluate(()=>window.impacts)).toBe(1);
  await page.waitForTimeout(1200);expect(await page.evaluate(()=>window.impacts)).toBe(1);
  await page.keyboard.press('r');await expect(page.locator('#final-title')).toBeHidden();
  await expect(page.locator('#final-announcement')).toBeEmpty();
});
