/* Shared local-time Sankramana catalog for both 2027 calendar versions. */
let sankramanaManifestPromise;
const sankramanaCache=new Map();
async function loadSankramanaRows(place,day){
  sankramanaManifestPromise??=fetch('sankramana2027/manifest.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Could not load Sankramana catalog');return r.json();}).catch(e=>{sankramanaManifestPromise=null;throw e;});
  const manifest=await sankramanaManifestPromise,file=manifest.files[place.place_id];
  if(!file)throw Error('City missing from Sankramana catalog');
  let payload=sankramanaCache.get(place.place_id);
  if(!payload){
    const response=await fetch('sankramana2027/'+file);if(!response.ok)throw Error('Could not load Sankramana events');
    payload=await response.json();if(payload.place_id!==place.place_id)throw Error('Sankramana city identity mismatch');
    if(sankramanaCache.size>=5)sankramanaCache.delete(sankramanaCache.keys().next().value);
    sankramanaCache.set(place.place_id,payload);
  }
  return payload.days[day]||[];
}
function renderSankramanas(rows,weekly=false){
  const section=document.createElement('section');section.className=weekly?'sankramana-events events':'sankramana-events';
  const heading=document.createElement(weekly?'h3':'h2');heading.textContent='Sankramana';section.append(heading);
  for(const [name,message,details,role] of rows){
    const card=document.createElement('article');card.className=weekly?'sankramana-event event':'sankramana-event';card.dataset.role=role;
    const title=document.createElement(weekly?'h4':'h3');title.textContent=name;
    const guidance=document.createElement('p');guidance.className='event-message';guidance.textContent=message;
    const timing=document.createElement('p');timing.className='event-details';timing.textContent=details;
    card.append(title,guidance,timing);section.append(card);
  }
  return section;
}
