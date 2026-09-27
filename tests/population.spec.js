import {test,expect} from '@playwright/test';
import {createPopulationLayout,createPopulation,archetypes} from '../src/scene/population';
import {createFlybyCues} from '../src/core/flybyAudio';
import {debugDefaults,actTwoTiming,cameraDistance,entryTravel} from '../src/config/actTwo';

test('layered population repeats all archetypes deterministically and resets without allocation',()=>{
  const a=createPopulationLayout(),b=createPopulationLayout();expect(a).toEqual(b);
  for(const type of archetypes)expect(a.midground.filter(e=>e.type===type).length).toBeGreaterThanOrEqual(3);
  expect(a.secondary.length).toBeGreaterThanOrEqual(300);
  for(const object of [...a.midground,...a.secondary])expect(Math.hypot(object.position[0],object.position[1])).toBeGreaterThan(10);
  const population=createPopulation(),objects=[...population.group.children];
  const state={time:2,cameraZ:-entryTravel-cameraDistance(2),progress:.2,emergence:1,collapse:0,tuning:{...debugDefaults}};
  population.update(state);const matrices=objects.map(o=>Array.from(o.instanceMatrix.array));
  population.update({...state,time:8,cameraZ:-400,progress:.8,collapse:.3});population.update(state);
  expect(population.group.children).toEqual(objects);
  objects.forEach((object,i)=>expect(Array.from(object.instanceMatrix.array)).toEqual(matrices[i]));
  expect(objects.length).toBeLessThan(16);population.dispose();
});

test('only six curated close passes produce rate-compensated whoosh cues',()=>{
  const cues=createFlybyCues(debugDefaults);expect(cues).toHaveLength(6);
  for(const cue of cues){expect(cue.at+.7/cue.rate).toBeCloseTo(cue.closest,6);expect(cue.rate).toBeGreaterThanOrEqual(.94);expect(cue.rate).toBeLessThanOrEqual(1.06);expect(cue.closest).toBeLessThan(actTwoTiming.flyDuration-actTwoTiming.convergenceDuration);}
  expect(cues.filter(c=>c.pan<0)).toHaveLength(3);expect(cues.filter(c=>c.pan>0)).toHaveLength(3);
  expect(createFlybyCues({...debugDefaults,closePassCount:2})).toHaveLength(2);
  expect(createFlybyCues({...debugDefaults,showHeroes:false})).toHaveLength(0);
});

test('population controls disable layers and reset restores authored defaults',async({page})=>{
  await page.goto('/');await expect(page.locator('#stage')).toHaveAttribute('data-state','ready',{timeout:30000});await page.keyboard.press('d');
  await page.locator('[data-act-two="FLYTHROUGH_MID"]').click();
  await expect.poll(async()=>Number((await page.locator('#debug-population').textContent()).split('/')[1])).toBeGreaterThan(5);
  for(const name of ['showHeroes','showSecondary','showStars','showStreaks','showFog'])await page.locator(`[data-tune="${name}"]`).uncheck();
  await expect.poll(async()=>Number((await page.locator('#debug-population').textContent()).split('/')[0])).toBe(0);
  await expect.poll(async()=>Number((await page.locator('#debug-population').textContent()).split('/')[2])).toBe(0);
  await page.locator('[data-tune="closePassCount"]').fill('2');await page.locator('[data-tune="starDensity"]').fill('0.3');
  await page.locator('[data-tune="showFog"]').focus();
  await page.keyboard.press('r');
  for(const name of ['showHeroes','showSecondary','showStars','showStreaks','showFog'])await expect(page.locator(`[data-tune="${name}"]`)).toBeChecked();
  await expect(page.locator('[data-tune="closePassCount"]')).toHaveValue('6');await expect(page.locator('[data-tune="starDensity"]')).toHaveValue('1');
});
