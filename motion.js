// Observe the existing renderer rather than delaying navigation or autosave.
export function initConstructorMotion(){
 const page=document.querySelector('#page');
 if(!page)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let lastPage='',transition;
 const tracked=new WeakMap();
 function images(){
  document.querySelectorAll('main img,dialog img').forEach(img=>{
   const src=img.getAttribute('src');
   if(!src||img.hidden||tracked.get(img)?.src===src)return;
   tracked.get(img)?.cleanup();
   let host=img.parentElement;
   if(!host.matches('.pack-cover,.slot-preview,.catalog-banner,.image-load-frame')){
    host=document.createElement('span');host.className='image-load-frame';
    if(img.classList.contains('grid-card-image'))host.classList.add('card-image-frame');
    img.before(host);host.append(img);
   }
   host.classList.add('image-load-host');
   const loader=document.createElement('span');loader.className='image-preloader';loader.setAttribute('role','status');loader.setAttribute('aria-label','Загрузка изображения');
   loader.innerHTML='<span class="image-preloader-spinner" aria-hidden="true"></span>';
   host.append(loader);
   img.classList.add('image-is-loading');
   function finish(failed){
    if(tracked.get(img)?.src!==src)return;
    img.classList.remove('image-is-loading');
    loader.classList.toggle('image-load-error',failed);
    if(failed){loader.textContent='Не удалось загрузить изображение';loader.setAttribute('aria-label',loader.textContent);}
    else loader.remove();
   }
   const loaded=()=>finish(!img.naturalWidth),failed=()=>finish(true);
   const cleanup=()=>{img.removeEventListener('load',loaded);img.removeEventListener('error',failed);loader.remove();};
   tracked.set(img,{src,cleanup});
   img.addEventListener('load',loaded);img.addEventListener('error',failed);
   if(img.complete)finish(!img.naturalWidth);
  });
 }
 function update(){
  const key=document.body.dataset.section+'|'+(document.querySelector('#crumb')?.textContent||'');
  if(lastPage&&key!==lastPage){
   transition?.cancel();
   if(!reduced.matches)transition=page.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:230,easing:'cubic-bezier(.2,.7,.3,1)'});
  }
  lastPage=key;images();
 }
 const observer=new MutationObserver(update);
 observer.observe(document.querySelector('main'),{childList:true,subtree:true,attributes:true,attributeFilter:['src','hidden']});
 observer.observe(document.querySelector('#modal'),{childList:true,subtree:true,attributes:true,attributeFilter:['src','hidden']});
 reduced.addEventListener('change',()=>{if(reduced.matches)transition?.cancel();});
 update();
}
