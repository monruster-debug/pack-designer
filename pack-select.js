// Vanilla adapter for StatsPackSelect.vue. Both consume assets/pack-select.css.
export function enhancePackSelect(select,{iconForOption,icon,esc}){
 const root=document.createElement('div');root.className='pack-select';
 const trigger=document.createElement('button');trigger.type='button';trigger.className='pack-trigger';
 trigger.setAttribute('role','combobox');trigger.setAttribute('aria-label','Фильтр по паку');trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
 const menu=document.createElement('div');menu.id=select.id+'-options';menu.className='pack-options pack-options--floating';menu.setAttribute('role','listbox');menu.setAttribute('aria-label','Паки');
 const nativePopover=typeof menu.showPopover==='function';
 if(nativePopover)menu.setAttribute('popover','auto');else menu.hidden=true;
 trigger.setAttribute('aria-controls',menu.id);
 const originalParent=select.parentElement;
 originalParent.before(root);root.append(trigger);document.body.append(menu);
 select.hidden=true;select.tabIndex=-1;select.setAttribute('aria-hidden','true');root.append(select);originalParent.remove();
 let open=false,active=select.selectedIndex;
 const options=[...select.options];
 function optionIcon(option){return option.value?iconForOption(option.value):'';}
 function sync(){const option=options[select.selectedIndex];trigger.innerHTML=optionIcon(option)+'<span>'+esc(option.textContent)+'</span>'+icon('down');trigger.lastElementChild.classList.add('chevron');}
 function renderOptions(){
  menu.innerHTML=options.map((option,index)=>'<button type="button" role="option" id="'+menu.id+'-'+index+'" aria-selected="'+(select.value===option.value)+'" class="'+(active===index?'active':'')+'" tabindex="-1">'+optionIcon(option)+'<span>'+esc(option.textContent)+'</span>'+(select.value===option.value?'<span class="check" aria-hidden="true"></span>':'')+'</button>').join('');
  [...menu.children].forEach((button,index)=>{button.addEventListener('click',()=>choose(index));button.addEventListener('pointerenter',()=>highlight(index));});
 }
 function highlight(index){active=index;[...menu.children].forEach((el,i)=>el.classList.toggle('active',i===index));trigger.setAttribute('aria-activedescendant',menu.id+'-'+index);}
 function place(){
  if(!open)return;
  const rect=trigger.getBoundingClientRect();menu.style.width=Math.max(rect.width,Math.min(280,innerWidth-32))+'px';menu.style.maxHeight=Math.max(80,Math.min(320,innerHeight-32))+'px';
  const box=menu.getBoundingClientRect();const below=innerHeight-rect.bottom-16,above=rect.top-16;
  const useAbove=below<Math.min(box.height,160)&&above>below;
  menu.style.maxHeight=Math.max(48,Math.min(320,useAbove?above-6:below-6))+'px';
  menu.style.left=Math.max(16,Math.min(rect.left,innerWidth-box.width-16))+'px';
  menu.style.top=(useAbove?Math.max(16,rect.top-menu.getBoundingClientRect().height-6):rect.bottom+6)+'px';
 }
 function close(focus=false){open=false;trigger.setAttribute('aria-expanded','false');trigger.removeAttribute('aria-activedescendant');if(nativePopover&&menu.matches(':popover-open'))menu.hidePopover();else if(!nativePopover)menu.hidden=true;if(focus)trigger.focus();}
 function show(){open=true;active=select.selectedIndex;renderOptions();if(nativePopover)menu.showPopover();else menu.hidden=false;trigger.setAttribute('aria-expanded','true');highlight(active);place();menu.children[active]?.scrollIntoView({block:'nearest'});}
 function choose(index){if(options[index].disabled)return;select.value=options[index].value;close(true);sync();select.dispatchEvent(new Event('change',{bubbles:true}));}
 function key(event){
  if(event.key==='Escape'){if(open){event.preventDefault();event.stopPropagation();close(true);}return;}
  if(event.key==='Tab'){close();return;}
  if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const wasOpen=open;if(!open)show();const next=event.key==='Home'?0:event.key==='End'?options.length-1:!wasOpen?active:(active+(event.key==='ArrowUp'?-1:1)+options.length)%options.length;highlight(next);menu.children[next]?.scrollIntoView({block:'nearest'});}
  else if((event.key==='Enter'||event.key===' ')&&open){event.preventDefault();choose(active);}
 }
 trigger.addEventListener('click',()=>open?close():show());trigger.addEventListener('keydown',key);menu.addEventListener('keydown',key);
 menu.addEventListener('toggle',event=>{if(event.newState==='closed'&&open)close();});
 const outside=event=>{if(open&&!root.contains(event.target)&&!menu.contains(event.target))close();};
 document.addEventListener('pointerdown',outside);window.addEventListener('resize',place);window.addEventListener('scroll',place,true);select.addEventListener('change',sync);sync();
 return ()=>{close();menu.remove();document.removeEventListener('pointerdown',outside);window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};
}
