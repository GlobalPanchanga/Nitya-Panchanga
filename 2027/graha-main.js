/* Sunrise grahas for the main 2027 calendar. */
(()=>{
'use strict';
const rashis=['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrischika','Dhanu','Makara','Kumbha','Meena'];
const stars=['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Moola','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
const names=['Lagna','Surya','Chandra','Mangala','Budha','Guru','Shukra','Shani','Rahu','Ketu'];
const short=['La','Su','Ch','Ma','Bu','Gu','Shu','Sha','Ra','Ke'];
const slots=[[11,1,1],[0,1,2],[1,1,3],[2,1,4],[3,2,4],[4,3,4],[5,4,4],[6,4,3],[7,4,2],[8,4,1],[9,3,1],[10,2,1]];
const version='GRAHA_2027_V1_CALENDAR_NIRAYANA_MEAN_NODES';
let manifestPromise=null;const cache=new Map();
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e};
function decode(values){
 if(!Array.isArray(values)||values.length!==11||!values.every(Number.isFinite)||!Number.isInteger(values[10])||values[10]<0||values[10]>255)throw Error('Invalid graha record');
 const angles=values.slice(1,10);if(angles.some(a=>a<0||a>=360))throw Error('Invalid graha longitude');angles.push((angles[8]+180)%360);
 return angles.map((lon,i)=>{const sec=Math.floor((lon%30)*3600);return {name:names[i],short:short[i],sign:Math.floor(lon/30),longitude:lon,position:`${String(Math.floor(sec/3600)).padStart(2,'0')}° ${String(Math.floor(sec/60)%60).padStart(2,'0')}′ ${String(sec%60).padStart(2,'0')}″`,nakshatra:stars[Math.floor(lon*27/360)],pada:Math.floor(lon*108/360)%4+1,motion:i===0?'—':((values[10]&(1<<((i===9?8:i)-1)))?'Retrograde':'Direct')};});
}
window.loadGrahaAtSunrise=async(place,day)=>{
 if(!manifestPromise)manifestPromise=fetch('graha2027/manifest.json',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('Could not load graha catalog');const m=await r.json();if(m.version!==version||m.locations!==2237)throw Error('Invalid graha catalog');return m}).catch(e=>{manifestPromise=null;throw e});
 const m=await manifestPromise;const filename=m.files[place.place_id];if(!filename||filename.includes('/')||filename.includes('..'))throw Error('City missing from graha catalog');
 let data=cache.get(place.place_id);
 if(!data){const r=await fetch('graha2027/'+filename);if(!r.ok)throw Error('Could not load graha positions');data=await r.json();if(data.place_id!==place.place_id||data.version!==version||data.timezone!==place.timezone)throw Error('Graha city mismatch');if(cache.size>=5)cache.delete(cache.keys().next().value);cache.set(place.place_id,data)}
 const values=data.days[day];const rows=decode(values);const instant=new Date(values[0]*1000);if(!Number.isFinite(instant.getTime()))throw Error('Invalid sunrise instant');
 const localDate=new Intl.DateTimeFormat('en-CA',{timeZone:data.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(instant);const parts=Object.fromEntries(localDate.map(p=>[p.type,p.value]));if(`${parts.year}-${parts.month}-${parts.day}`!==day)throw Error('Graha sunrise date mismatch');
 return {rows,day,time:new Intl.DateTimeFormat('en-US',{timeZone:data.timezone,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true}).format(instant)};
};
window.renderGrahaAtSunrise=data=>{
 const section=node('section',undefined,'graha-events');section.append(node('h2','Graha positions at sunrise'));
 if(!data){section.append(node('p','Graha positions could not be loaded. Please refresh to try again.'));return section}
 section.append(node('p','Sunrise: '+data.time+' · All times are local.','graha-time'));
 section.append(node('h3','Rashi chart'));
 const chart=node('div',undefined,'graha-chart');chart.setAttribute('role','group');chart.setAttribute('aria-label','South Indian Rashi chart at local sunrise');
 for(const [sign,row,col]of slots){const cell=node('div',undefined,'graha-rashi-cell');cell.dataset.rashi=rashis[sign];cell.style.gridRow=row;cell.style.gridColumn=col;cell.append(node('span',rashis[sign],'graha-rashi-name'));const chips=node('div',undefined,'graha-chips');for(const g of data.rows.filter(g=>g.sign===sign)){const chip=node('span',g.short+(g.motion==='Retrograde'?' ↺':''),'graha-chip'+(g.name==='Lagna'?' graha-lagna':''));chip.dataset.graha=g.name;chip.title=`${g.name} · ${rashis[sign]} ${g.position}`+(g.motion==='Retrograde'?' · Retrograde':'');chip.setAttribute('aria-label',chip.title);chips.append(chip)}cell.append(chips);chart.append(cell)}
 const center=node('div',undefined,'graha-chart-center');center.append(node('strong','Rashi'),node('span','At local sunrise'));chart.append(center);section.append(chart);
 section.append(node('p','La = Lagna · ↺ = Retrograde\nSu Surya · Ch Chandra · Ma Mangala · Bu Budha · Gu Guru\nShu Shukra · Sha Shani · Ra Rahu · Ke Ketu','graha-legend'));
 section.append(node('h3','Graha details'));
 const wrap=node('div',undefined,'graha-table-scroll');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Graha details; scroll horizontally on small screens');const table=node('table');const head=node('thead'),tr=node('tr');for(const title of ['Graha','Rashi','Position','Nakshatra','Pada','Motion']){const th=node('th',title);th.scope='col';tr.append(th)}head.append(tr);table.append(head);const body=node('tbody');
 for(const g of data.rows){const row=node('tr');row.dataset.graha=g.name;for(const text of [g.name,rashis[g.sign],g.position,g.nakshatra,g.pada,g.motion])row.append(node('td',String(text)));body.append(row)}table.append(body);wrap.append(table);section.append(wrap);return section;
};
})();
