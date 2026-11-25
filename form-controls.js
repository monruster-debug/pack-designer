// Keep required labels and validation messages consistent across dynamic forms.
export function enhanceRequiredFields(root=document){
 for(const input of root.querySelectorAll('.field input[required],.field textarea[required],.field select[required]')){
  const field=input.closest('.field'),label=field?.querySelector('label');
  input.setAttribute('aria-required','true');
  if(label&&!label.querySelector('.required-mark')){
   const mark=document.createElement('span');mark.className='required-mark';mark.textContent=' *';mark.setAttribute('aria-hidden','true');label.append(mark);
  }
 }
}
export function initFieldValidation(root=document){
 root.addEventListener('invalid',event=>{
  const input=event.target,field=input.closest?.('.field');if(!field)return;
  input.setAttribute('aria-invalid','true');
  let message=field.querySelector('.field-validation-error');
  if(!message){message=document.createElement('span');message.className='hint error field-validation-error';message.id=input.id+'-error';message.setAttribute('role','alert');field.append(message);}
  const ids=new Set((input.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));ids.add(message.id);input.setAttribute('aria-describedby',[...ids].join(' '));
  message.textContent=input.validationMessage||'Проверьте значение поля.';
 },true);
 root.addEventListener('input',event=>{
  const input=event.target;if(input.getAttribute?.('aria-invalid')!=='true'||!input.validity?.valid)return;
  input.removeAttribute('aria-invalid');const message=input.closest('.field')?.querySelector('.field-validation-error');
  if(message){const ids=(input.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!==message.id);if(ids.length)input.setAttribute('aria-describedby',ids.join(' '));else input.removeAttribute('aria-describedby');message.remove();}
 });
}
