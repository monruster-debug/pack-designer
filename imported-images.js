// Match imported files by decoded dimensions, never by legacy filenames alone.
export async function verifyImportedImages(images,specs,measure){
 const source=Object.entries(images).filter(([,rec])=>rec?.sourceUrl&&!rec.sourceVerified);
 const results=await Promise.all(source.map(async([slot,rec])=>{
  try{
   const size=await measure(rec.sourceUrl);
   const target=specs.find(s=>s.width===size.width&&s.height===size.height);
   let error=!target?'Фактический размер '+size.width+' × '+size.height+' px не соответствует ни одному формату.':'';
   if(!Number.isInteger(rec.bytes)||rec.bytes<=0)error='Не удалось подтвердить размер файла.';
   else if(rec.bytes>1024*1024)error='Размер файла превышает 1 МБ.';
   else if(!['image/jpeg','image/png','image/webp'].includes(rec.mime))error='Нужен JPG, PNG или WebP.';
   return {slot,target:target?.id||slot,original:rec,record:{...rec,...size,sourceVerified:true,verificationError:error}};
  }catch{return {slot,target:slot,original:rec,record:{...rec,sourceVerified:true,verificationError:'Не удалось загрузить изображение для проверки. Обновите страницу и повторите проверку.'}};}
 }));
 const next={...images};
 for(const r of results)if(images[r.slot]===r.original)delete next[r.slot];
 for(const r of results){
  if(images[r.slot]!==r.original)continue;
  // A local replacement or an already occupied target must never be overwritten.
  if(next[r.target]){next[r.slot]={...r.record,verificationError:'Этот формат уже занят другим изображением.'};}
  else next[r.target]=r.record;
 }
 return next;
}
