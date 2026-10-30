'use strict';
const $=s=>document.querySelector(s),YEAR=2027,MIN='2027-01-01',MAX='2027-12-31';
const STORAGE='panchanga.weekly2027.city';
const params=new URLSearchParams(location.search);
let catalog=[],groups=new Map(),selectedDay='2027-01-15',first='',prefix='',selectedId=null,expanded=true,revision=0;
const baseCache=new Map(),eventCache=new Map();let baseManifestPromise,eventManifestPromise;
const special={'Æ':'AE','Œ':'OE','Ø':'O','Ł':'L','Đ':'D','Ð':'D','Þ':'TH','ẞ':'SS','ı':'I'};
function cityPrefix(name){const folded=name.toUpperCase().replace(/[ÆŒØŁĐÐÞẞı]/g,c=>special[c]||c).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z]/g,'');return folded.slice(0,2)||'#';}
function validDay(s){return /^2027-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;}
const instant=s=>new Date(s+'T12:00:00Z');
const iso=d=>d.toISOString().slice(0,10);
function shift(s,n){const d=instant(s);d.setUTCDate(d.getUTCDate()+n);return iso(d);}
function rollingDays(s){let start=shift(s,-3);if(start<MIN)start=MIN;if(shift(start,6)>MAX)start=shift(MAX,-6);return Array.from({length:7},(_,i)=>shift(start,i));}
function dateLabel(s){return new Intl.DateTimeFormat('en',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(instant(s));}
function currentURL(view='weekly.html'){const u=new URL(view,location.href);u.search='';u.searchParams.set('date',selectedDay);if(selectedId)u.searchParams.set('city',selectedId);return u;}
function updateURL(){history.replaceState(null,'',currentURL());$('#search-version').href=currentURL('index.html').href;$('#share').disabled=!selectedId;}
function remember(id){try{localStorage.setItem(STORAGE,id)}catch{$('#notice').textContent='Bookmark the link to keep this city; browser storage is unavailable.';}}
function savedCity(){try{return localStorage.getItem(STORAGE)}catch{return null;}}
function findCity(id){return catalog.find(p=>p.place_id===id||(p.legacy_place_ids||[]).includes(id));}
async function jsonAsset(path,uncached=false){const r=await fetch(path,uncached?{cache:'no-store'}:{});if(!r.ok)throw Error('Could not load '+path);return r.json();}
async function cityPayload(place,kind){const cache=kind==='base'?baseCache:eventCache;
 if(cache.has(place.place_id))return cache.get(place.place_id);
 let manifest;
 if(kind==='base'){baseManifestPromise??=jsonAsset('year2027/manifest.json',true).catch(e=>{baseManifestPromise=null;throw e;});manifest=await baseManifestPromise;}
 else{eventManifestPromise??=jsonAsset('events2027/manifest.json',true).catch(e=>{eventManifestPromise=null;throw e;});manifest=await eventManifestPromise;}
 const file=manifest.files[place.place_id];if(!file)throw Error('City missing from '+kind+' catalog');
 const payload=await jsonAsset((kind==='base'?'year2027/':'events2027/')+file);if(payload.place_id!==place.place_id)throw Error('City identity mismatch');
 if(cache.size>=5)cache.delete(cache.keys().next().value);cache.set(place.place_id,payload);return payload;
}
function renderData(row,events,content){const dl=document.createElement('dl');
 for(const key of ['Samvatsara','Ayana','Ritu','Amanta Maasa','Paksha','Tithi','Vaara','Nakshatra','Yoga','Karana','Sooryodaya']){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=row[key]||'—';dl.append(dt,dd);}
 const block=document.createElement('section');block.className='events';const h=document.createElement('h3');h.textContent='Ekadashi';block.append(h);
 if(!events.length){const p=document.createElement('p');p.className='no-event';p.textContent='No Ekadashi observance today.';block.append(p);}
 for(const [name,message,details,role] of events){const card=document.createElement('article');card.className='event';card.dataset.role=role;const title=document.createElement('h4'),action=document.createElement('p'),time=document.createElement('p');title.textContent=name;action.className='event-message';action.textContent=message;time.className='event-details';time.textContent=details;card.append(title,action,time);block.append(card);}
 content.replaceChildren(dl,block);
}
async function openCity(place,card){const day=selectedDay,version=revision;selectedId=place.place_id;remember(selectedId);updateURL();
 document.querySelectorAll('.city-card[open]').forEach(other=>{if(other!==card)other.open=false;});
 const content=card.querySelector('.city-content');if(content.dataset.loaded===day)return;content.textContent='Loading Panchanga…';
 try{const [base,event]=await Promise.all([cityPayload(place,'base'),cityPayload(place,'events')]);
  if(version!==revision||day!==selectedDay||!card.isConnected)return;
  const values=base.days[day];if(!values)throw Error('Date missing from city data');
  const row=Object.fromEntries(base.fields.map((field,i)=>[field,values[i]]));renderData(row,event.days[day]||[],content);content.dataset.loaded=day;
 }catch(error){if(version===revision&&card.isConnected){content.textContent='Unable to load this Panchanga. ';const retry=document.createElement('button');retry.type='button';retry.textContent='Try again';retry.onclick=()=>openCity(place,card);content.append(retry);}}
}
function selectFirst(letter){first=letter;prefix='';selectedId=null;updateURL();drawGroups();}
function selectPrefix(value){prefix=value;selectedId=null;updateURL();drawGroups();$('#prefix-panel [data-prefix="'+value+'"]')?.focus({preventScroll:true});}
function drawGroups(){const letters=$('#letters'),sub=$('#prefix-panel'),cities=$('#city-panel');if(!letters)return;
 letters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.first===first)));
 sub.replaceChildren();cities.replaceChildren();sub.hidden=!first;cities.hidden=!prefix;if(!first)return;
 const label=document.createElement('p');label.className='step-label';label.textContent='2 · Choose the next letter';const grid=document.createElement('div');grid.className='prefix-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label','Two-letter city groups for '+first);
 for(const [key,places] of groups.get(first)){const b=document.createElement('button');b.type='button';b.className='prefix-button';b.dataset.prefix=key;b.setAttribute('aria-pressed',String(key===prefix));b.setAttribute('aria-label',key+', '+places.length+' cities');const name=document.createElement('span'),count=document.createElement('span');name.textContent=key;count.className='prefix-count';count.textContent=places.length+(places.length===1?' city':' cities');b.append(name,count);b.onclick=()=>selectPrefix(key);grid.append(b);}
 sub.append(label,grid);if(!prefix)return;
 const bucket=groups.get(first).get(prefix);const heading=document.createElement('h2');heading.textContent='3 · Choose your city ';const count=document.createElement('span');count.className='city-count';count.textContent='('+bucket.length+')';heading.append(count);cities.append(heading);
 for(const place of bucket){const card=document.createElement('details');card.className='city-card';card.dataset.placeId=place.place_id;
  const summary=document.createElement('summary'),text=document.createElement('span'),name=document.createElement('span'),location=document.createElement('span'),content=document.createElement('div');
  name.textContent=place.city;location.className='city-location';location.textContent=[place.state_or_region,place.country].filter(Boolean).join(', ');text.append(name,location);summary.append(text);content.className='city-content';card.append(summary,content);card.ontoggle=()=>{if(card.open)openCity(place,card);};cities.append(card);
  if(place.place_id===selectedId)card.open=true;
 }
}
function renderCalendar(){revision++;const nav=$('#calendar');nav.replaceChildren();$('#jump-date').value=selectedDay;$('#previous').disabled=selectedDay===MIN;$('#next').disabled=selectedDay===MAX;updateURL();
 for(const d of rollingDays(selectedDay)){const entry=document.createElement('div');entry.className='date-entry';entry.dataset.date=d;const button=document.createElement('button');button.type='button';button.className='date-toggle';const open=d===selectedDay&&expanded;button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-controls','day-'+d);const label=document.createElement('span'),icon=document.createElement('span');label.textContent=dateLabel(d);icon.className='date-icon';icon.setAttribute('aria-hidden','true');icon.textContent=open?'−':'+';button.append(label,icon);button.onclick=()=>{if(d===selectedDay){expanded=!expanded;renderCalendar();}else setDay(d);};entry.append(button);
  if(open){const content=document.createElement('section');content.className='date-content';content.id='day-'+d;content.setAttribute('aria-label','Cities and Panchanga for '+dateLabel(d));const step=document.createElement('p');step.className='step-label';step.textContent='1 · Choose the first letter of your city';const letters=document.createElement('div');letters.id='letters';letters.className='alphabet-grid';letters.setAttribute('role','group');letters.setAttribute('aria-label','City initials');
   for(const key of groups.keys()){const b=document.createElement('button');b.type='button';b.className='alphabet-button';b.dataset.first=key;b.textContent=key;b.setAttribute('aria-pressed',String(key===first));b.onclick=()=>selectFirst(key);letters.append(b);}
   const sub=document.createElement('div'),cities=document.createElement('div');sub.id='prefix-panel';sub.className='prefix-panel';cities.id='city-panel';cities.className='city-panel';content.append(step,letters,sub,cities);entry.append(content);
  }else{const empty=document.createElement('section');empty.id='day-'+d;empty.hidden=true;entry.append(empty);}nav.append(entry);
 }drawGroups();
}
function setDay(d){if(!validDay(d)){$('#notice').textContent='Choose a valid date in 2027.';return;}selectedDay=d;expanded=true;renderCalendar();}
$('#previous').onclick=()=>setDay(shift(selectedDay,-7)<MIN?MIN:shift(selectedDay,-7));$('#next').onclick=()=>setDay(shift(selectedDay,7)>MAX?MAX:shift(selectedDay,7));$('#jump-date').onchange=()=>setDay($('#jump-date').value);
$('#share').onclick=async()=>{const url=currentURL().href;try{await navigator.clipboard.writeText(url);$('#notice').textContent='City and date link copied.';}catch{$('#notice').textContent=url;}};
(async()=>{catalog=await jsonAsset('places.json');catalog.sort((a,b)=>a.city.localeCompare(b.city,'en',{sensitivity:'base'})||a.country.localeCompare(b.country)||a.place_id.localeCompare(b.place_id));
 const unsorted=new Map();for(const place of catalog){const key=cityPrefix(place.city),initial=key[0];if(!unsorted.has(initial))unsorted.set(initial,new Map());const buckets=unsorted.get(initial);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(place);}
 groups=new Map([...unsorted].sort(([a],[b])=>a.localeCompare(b)).map(([initial,buckets])=>[initial,new Map([...buckets].sort(([a],[b])=>a.localeCompare(b)))]));
 const date=params.get('date');if(validDay(date||''))selectedDay=date;else if(date)$('#notice').textContent='Invalid date in link. Showing January 15, 2027.';
 const requested=params.get('city'),remembered=requested||savedCity(),place=findCity(remembered);if(place){selectedId=place.place_id;prefix=cityPrefix(place.city);first=prefix[0];}else if(requested)$('#notice').textContent='That city could not be found. Browse the letters below.';
 if(!$('#notice').textContent.includes('Invalid')&&!requested?.length)$('#notice').textContent='Browse '+catalog.length.toLocaleString()+' cities. Only letter groups with cities are shown.';
 else if(place)$('#notice').textContent='Browse '+catalog.length.toLocaleString()+' cities. Only letter groups with cities are shown.';
 renderCalendar();
})().catch(()=>{$('#notice').textContent='Unable to load the city directory. Please refresh and try again.';});
