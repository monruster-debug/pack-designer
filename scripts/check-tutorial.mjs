import assert from 'node:assert/strict';
import {initConstructorTutorial,tutorialSteps} from '../tutorial.js';

const elements=[];
function element(){
 const classes=new Set(),listeners={};
 const node={style:{},dataset:{},isConnected:true,offsetTop:100,open:false,
  classList:{contains:c=>classes.has(c),toggle(c,on){on?classes.add(c):classes.delete(c);}},
  setAttribute(){},append(){},replaceChildren(){},focus(){},
  getBoundingClientRect:()=>({left:20,top:100,right:220,bottom:350,width:200,height:250}),
  addEventListener:(name,fn)=>listeners[name]=fn,
  querySelector:()=>element(),showModal(){this.open=true;},close(){this.open=false;},
  fire(name,event={}){listeners[name]?.(event);}
 };elements.push(node);return node;
}
const sidebar=element(),menu=element(),modal=element(),body=element(),target=element();
const storage=new Map(),navigations=[];let section='about';
globalThis.document={body,activeElement:target,createElement:element,
 querySelector(selector){if(selector==='dialog[open]')return elements.find(el=>el.open)||null;
  return ({'#sidebar':sidebar,'#mobile-menu':menu,'#modal':modal})[selector]||target;},
 querySelectorAll:()=>[target]};
globalThis.localStorage={getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)};
globalThis.MutationObserver=class{observe(){}};
globalThis.window={addEventListener(){},scrollTo(){}};
Object.assign(globalThis,{innerWidth:360,innerHeight:740,scrollY:120,requestAnimationFrame:()=>1,cancelAnimationFrame(){}});
const dependencies={navigate:id=>{section=id;navigations.push(id);},getSection:()=>section,btn:()=>'',icon:()=>''};
initConstructorTutorial(dependencies);
const tour=elements.find(el=>el.id==='constructor-tutorial');
assert.equal(tutorialSteps.length,5);
assert.equal(tour.open,true,'First workshop entry starts the tour');
const click=action=>tour.fire('click',{target:{closest:()=>({dataset:{tour:action}})}});
for(let i=0;i<4;i++)click('next');
assert.equal(section,'review');assert.match(tour.innerHTML,/5 из 5/);
click('back');assert.match(tour.innerHTML,/Мир и правила/);
click('next');click('next');
assert.equal(tour.open,false);assert.equal(section,'about','Restore the original section');
assert.equal(storage.get('shelter42-workshop-tour-v1'),'done');
const trigger=elements.find(el=>el.className?.includes('tutorial-trigger'));
trigger.fire('click');assert.equal(tour.open,true,'Replay remains available');
let prevented=false;tour.fire('cancel',{preventDefault(){prevented=true;}});
assert.ok(prevented);assert.equal(tour.open,false);
initConstructorTutorial(dependencies);
assert.equal(elements.filter(el=>el.open).length,0,'Do not repeat completed/skipped onboarding');
assert.ok(navigations.every(id=>['about','review'].includes(id)),'Only existing read-only screens are visited');
console.log('Tutorial: five steps, completion, back, replay, Escape, persistence and section restoration passed.');
