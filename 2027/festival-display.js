/* Shared festival wording and ordering for both calendar versions. */
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
  container.replaceChildren(...(dateLabel?[dateLabel]:[]),...festivals.filter(Boolean),panchanga);
}
