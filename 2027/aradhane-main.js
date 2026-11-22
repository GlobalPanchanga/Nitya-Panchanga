let aradhaneManifestPromise;
const aradhaneSchedules = new Map();

async function readAradhaneData(path, options) {
  const response = await fetch('aradhane-main2027/' + path, options);
  if (!response.ok) throw new Error('Could not load Aradhane');
  return response.json();
}

async function loadAradhaneRows(place, day) {
  aradhaneManifestPromise ??= readAradhaneData('manifest.json', {cache: 'no-store'}).catch(error => {
    aradhaneManifestPromise = undefined;
    throw error;
  });
  const manifest = await aradhaneManifestPromise;
  const file = manifest.files[place.place_id];
  if (!file) throw new Error('City missing from Aradhane catalog');
  if (!aradhaneSchedules.has(file)) {
    if (aradhaneSchedules.size >= 5) aradhaneSchedules.delete(aradhaneSchedules.keys().next().value);
    aradhaneSchedules.set(file, readAradhaneData(file).catch(error => {
      aradhaneSchedules.delete(file);
      throw error;
    }));
  }
  const schedule = await aradhaneSchedules.get(file);
  return (schedule[day] || []).map(index => manifest.records[index]);
}

function renderAradhanes(rows) {
  const section = document.createElement('section');
  section.className = 'aradhane-events';
  const heading = document.createElement('h2');
  heading.textContent = 'Aradhane';
  const list = document.createElement('ul');
  for (const [name, lineage, url] of rows) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.textContent = name;
    link.href = url;
    item.append(link);
    if (lineage) item.append(' (' + lineage + ')');
    list.append(item);
  }
  section.append(heading, list);
  return section;
}
