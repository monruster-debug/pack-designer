const STORAGE_KEY='shelter42-workshop-tour-v1';
export const tutorialSteps=[
 {title:'Левое меню',text:'Здесь собраны все разделы пака. Переключайтесь между ними в любом порядке и следите за готовностью набора.',targets:['#navigation'],menu:true},
 {title:'Правая часть конструктора',text:'Здесь вы заполняете выбранный раздел: название и описание пака, карточки и настройки. Черновик сохраняется в этом браузере автоматически.',targets:['#page .page-heading','#page .panel'],section:'about'},
 {title:'Карточки персонажа',text:'Профессия, биология, здоровье, хобби, факт и багаж описывают персонажа. В каждой категории нужно минимум 32 карточки. Укажите название и описание — изображения здесь не нужны.',targets:['[data-tour-group="character"]'],menu:true},
 {title:'Мир и правила',text:'Создайте бункер, выберите особые условия и добавьте катастрофы. Нужно минимум 32 карты бункера и 10 катастроф. Для каждой катастрофы обязательны четыре изображения.',targets:['[data-tour-group="world"]'],menu:true},
 {title:'Проверка пака',text:'Здесь собраны требования к паку и недостающие материалы. Исправьте замечания перед активацией. Локальное сохранение черновика не публикует пак на сайте.',targets:['#page .page-heading','#page .review-overview'],section:'review'}
];

// The tour only navigates existing screens; it never writes pack data.
export function initConstructorTutorial({navigate,getSection,btn,icon}){
 const trigger=document.createElement('button');
 trigger.type='button';trigger.className='btn kit-small tutorial-trigger';
 trigger.innerHTML=icon('info')+'Обучение';
 document.querySelector('.topbar').append(trigger);
 const dialog=document.createElement('dialog');
 dialog.id='constructor-tutorial';dialog.setAttribute('aria-labelledby','tutorial-title');
 dialog.setAttribute('aria-describedby','tutorial-description');document.body.append(dialog);
 let index=0,active=false,seen=false,originalSection,originalScroll,previousFocus,frame;
 try{seen=localStorage.getItem(STORAGE_KEY)==='done';}catch{}
 const sidebar=document.querySelector('#sidebar'),menu=document.querySelector('#mobile-menu');
 let originalMenu=false;
 function eligible(){return !getSection().startsWith('admin-')&&!['catalog','suggestions','statistics'].includes(getSection());}
 function position(){
  if(!active)return;
  const panel=dialog.querySelector('.tutorial-panel'),spot=dialog.querySelector('.tutorial-spotlight');
  const mobile=innerWidth<=760,gap=16,pw=Math.min(380,innerWidth-gap*2);
  panel.style.width=pw+'px';
  const ph=panel.getBoundingClientRect().height;
  const rects=tutorialSteps[index].targets.flatMap(selector=>[...document.querySelectorAll(selector)]).map(el=>el.getBoundingClientRect()).filter(r=>r.width&&r.height);
  if(!rects.length)return;
  let left=Math.max(8,Math.min(...rects.map(r=>r.left))-6),top=Math.max(8,Math.min(...rects.map(r=>r.top))-6);
  const right=Math.min(innerWidth-8,Math.max(...rects.map(r=>r.right))+6);
  const bottom=Math.min(innerHeight-8,Math.max(...rects.map(r=>r.bottom))+6);
  let height=Math.max(16,bottom-top),x,y;
  if(!mobile&&right+pw+gap*2<innerWidth){x=right+gap;y=Math.min(top,innerHeight-ph-gap);}
  else{
   x=Math.max(gap,Math.min(left,innerWidth-pw-gap));
   y=innerHeight-ph-gap;
   // Keep the highlighted content above the explanation on narrow screens.
   height=Math.max(16,Math.min(height,y-gap-top));
   if(top>y-gap-32){top=80;height=Math.max(16,y-gap-top);}
  }
  Object.assign(spot.style,{left:left+'px',top:top+'px',width:Math.max(16,right-left)+'px',height:height+'px'});
  Object.assign(panel.style,{left:x+'px',top:Math.max(gap,y)+'px'});
 }
 function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(position);}
 function draw(){
  const step=tutorialSteps[index];
  if(step.section)navigate(step.section);
  sidebar.classList.toggle('open',!!step.menu);menu.setAttribute('aria-expanded',String(!!step.menu));
  if(step.menu){const target=document.querySelector(step.targets[0]);if(target)sidebar.scrollTop=Math.max(0,target.offsetTop-24);}
  dialog.innerHTML='<div class="tutorial-spotlight" aria-hidden="true"></div><section class="tutorial-panel"><div class="tutorial-meta"><span aria-live="polite">'+(index+1)+' из 5</span><button type="button" class="tutorial-close" data-tour="skip" aria-label="Закрыть обучение">×</button></div><h2 id="tutorial-title">'+step.title+'</h2><p id="tutorial-description">'+step.text+'</p><footer>'+btn('Пропустить','kit-small tutorial-skip','data-tour="skip"')+'<div>'+(index?btn('Назад','kit-small','data-tour="back"'):'')+btn(index===4?'Начать работу':'Дальше','primary kit-small','data-tour="next"')+'</div></footer></section>';
  position();dialog.querySelector('[data-tour="next"]').focus({preventScroll:true});schedule();
 }
 function finish(){
  if(!active)return;
  active=false;seen=true;cancelAnimationFrame(frame);
  try{localStorage.setItem(STORAGE_KEY,'done');}catch{}
  dialog.close();dialog.replaceChildren();
  navigate(originalSection);sidebar.classList.toggle('open',originalMenu);menu.setAttribute('aria-expanded',String(originalMenu));
  window.scrollTo({top:originalScroll,behavior:'instant'});
  if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});else trigger.focus({preventScroll:true});
 }
 function start(){
  if(active||!eligible()||document.querySelector('dialog[open]'))return;
  originalSection=getSection();originalScroll=scrollY;originalMenu=sidebar.classList.contains('open');previousFocus=document.activeElement;
  active=true;index=0;draw();dialog.showModal();schedule();
 }
 dialog.addEventListener('cancel',event=>{event.preventDefault();finish();});
 dialog.addEventListener('click',event=>{
  const action=event.target.closest('[data-tour]')?.dataset.tour;
  if(action==='skip')finish();
  else if(action==='back'){index=Math.max(0,index-1);draw();}
  else if(action==='next'){if(index===4)finish();else{index++;draw();}}
 });
 function sync(){trigger.hidden=!eligible();if(!seen&&!active&&eligible())start();}
 trigger.addEventListener('click',start);
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-section']});
 document.querySelector('#modal').addEventListener('close',sync);
 window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,true);
 sync();
}
