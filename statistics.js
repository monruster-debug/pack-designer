export function gameStatistics(statistics, days=30, today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())) {
 const connected=Array.isArray(statistics?.daily), end=new Date(today+'T00:00:00Z');
 const rows=Array.from({length:days},(_,i)=>{const d=new Date(end);d.setUTCDate(d.getUTCDate()-days+1+i);return {date:d.toISOString().slice(0,10),completed:0,unfinished:0};});
 const byDate=new Map(rows.map(r=>[r.date,r]));
 for(const row of connected?statistics.daily:[]){const target=byDate.get(row?.date);if(!target||!Number.isSafeInteger(row.completed)||row.completed<0||!Number.isSafeInteger(row.unfinished)||row.unfinished<0)continue;target.completed+=row.completed;target.unfinished+=row.unfinished;}
 const totals=rows.reduce((t,r)=>({completed:t.completed+r.completed,unfinished:t.unfinished+r.unfinished}),{completed:0,unfinished:0});
 return {connected,rows:rows.map(r=>({...r,total:r.completed+r.unfinished})),...totals,total:totals.completed+totals.unfinished};
}
