export function getAccountUrl(location,configuredUrl){
 if(configuredUrl){
  try{const url=new URL(configuredUrl,location.href);if(['http:','https:'].includes(url.protocol))return url.href;}catch{}
 }
 const url=new URL(location.href);
 if(['127.0.0.1','localhost','[::1]'].includes(url.hostname))url.port='3000';
 else if(url.hostname==='workshop.test.37.230.114.30.nip.io')url.hostname='test.37.230.114.30.nip.io';
 url.pathname='/lk';url.search='';url.hash='';
 return url.href;
}
