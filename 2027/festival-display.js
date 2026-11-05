/* Shared festival wording and ordering for both calendar versions. */
let festivalManifestPromise;
const festivalCache=new Map();
async function loadFestivalRows(place,day){
  festivalManifestPromise??=fetch('festivals2027/manifest.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Could not load festivals');return r.json();}).catch(e=>{festivalManifestPromise=null;throw e;});
  const manifest=await festivalManifestPromise,file=manifest.files[place.place_id];if(!file)throw Error('City missing from festival catalog');
  let payload=festivalCache.get(place.place_id);
  if(!payload){const response=await fetch('festivals2027/'+file);if(!response.ok)throw Error('Could not load festivals');payload=await response.json();if(payload.place_id!==place.place_id)throw Error('Festival city identity mismatch');if(festivalCache.size>=5)festivalCache.delete(festivalCache.keys().next().value);festivalCache.set(place.place_id,payload);}
  return payload.days[day]||[];
}
function renderFestivals(rows,weekly=false){
  const section=document.createElement('section');section.className=weekly?'festival-events events':'festival-events';
  const heading=document.createElement(weekly?'h3':'h2');heading.textContent='Festivals';section.append(heading);
  for(const [name,message,details,role] of rows){
    const card=document.createElement('article');card.className=weekly?'festival-event event':'festival-event';card.dataset.role=role;
    const title=document.createElement(weekly?'h4':'h3');title.textContent=name==='Ugadi'?'Chaandramaana Ugadi':name;card.append(title);
    if(message){const p=document.createElement('p');p.className='event-message';p.textContent=message;card.append(p);}
    if(details){const p=document.createElement('p');p.className='event-details';p.textContent=details;card.append(p);}
    section.append(card);
  }
  return section;
}
function ekadashiGuidance(message,role){
  if(role==='UPAVASA_DAY_2')return 'Continue Upavaasa today.';
  const messages={
    'Observe Upavaasa today on Dwadashi. Ekadashi did not occur at sunrise.':'Observe Upavaasa on Dwadashi today because Ekadashi tithi was skipped (Tithi Kshaya).',
    'Observe Upavaasa today and continue tomorrow. Ekadashi is valid at two consecutive sunrises.':'Observe Upavaasa today and tomorrow. Ekadashi extends across two days.',
    'Observe Upavaasa today and continue tomorrow. A valid Ekadashi sunrise is followed by Dwadashi at two consecutive sunrises.':'Observe Upavaasa today and tomorrow. Dwadashi extends across two days, so this observance includes fasting on Ekadashi and the first Dwadashi day.',
    'Observe Upavaasa today and continue tomorrow. This is the Shravanopavaasa observance.':'Observe Upavaasa today and tomorrow for the Shravanopavaasa observance.'
  };
  return messages[message]||message;
}
function renderFestivalDay(container,panchanga,festivals,dateLabel=null){
  // All present and future festival sections belong in this list before Panchanga.
  const heading=document.createElement(container.classList.contains('city-content')?'h3':'h2');heading.className='panchanga-heading';heading.textContent='Panchanga';
  container.replaceChildren(...(dateLabel?[dateLabel]:[]),...festivals.filter(Boolean),heading,panchanga);
}
