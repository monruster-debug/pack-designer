// Clipboard API on HTTPS/localhost, selection fallback for the HTTP test host.
export async function copyText(text){
 try{if(globalThis.navigator?.clipboard?.writeText){await navigator.clipboard.writeText(text);return;}}catch{}
 const doc=globalThis.document,active=doc.activeElement,selection=doc.getSelection?.();
 const ranges=[];if(selection)for(let i=0;i<selection.rangeCount;i++)ranges.push(selection.getRangeAt(i).cloneRange());
 const input=doc.createElement('textarea');input.value=text;input.readOnly=true;
 input.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';
 // Keep the fallback inside an open native dialog's focus scope.
 (doc.querySelector('dialog[open]')||doc.body).append(input);
 try{input.select();if(!doc.execCommand('copy'))throw new Error('Не удалось скопировать ID.');}
 finally{input.remove();active?.focus({preventScroll:true});if(selection){selection.removeAllRanges();for(const range of ranges)selection.addRange(range);}}
}
