import './style.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-canvas-markers';
import L from 'leaflet';

import data from '../pois.json';

function formatDescription(poi: any) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const productDeadlines = poi.product_deadlines['003BE_LZ'];
  let description = `${poi.name}<br>`;

  for (let i = 1; i <= 7; i++) {
    const deadline = productDeadlines[i];
    description += `${days[i % 7]}: ${deadline ? deadline.slice(0, 5) : '<i>None</i>'}<br>`;
  }

  return description;
}

function isStillOpen(poi: any) {
  const now = new Date();
  const weekday = now.getDay() || 7;
  const productDeadlines = poi.product_deadlines['003BE_LZ'];
  const deadline = productDeadlines[weekday];
  if (!deadline) return false;

  const [hours, minutes] = deadline.split(':').map(Number);
  const deadlineDate = new Date();
  deadlineDate.setHours(hours, minutes, 0, 0);
  return deadlineDate > now;
}

async function main() {
  // 47.331663, 8.361608 -- 47.536873, 8.836567

  const map = L.map('map').setView([47.434268, 8.599], 12);

  // load a tile layer
  L.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg',
    {
      attribution: 'Data: &copy; <a href="https://www.swisstopo.admin.ch/en/home.html">swisstopo</a>',
      maxZoom: 17,
      minZoom: 8
    }).addTo(map);

  const canvasRenderer = L.canvas(); // Use canvas renderer for markers

  const closedPOIs = data.filter((poi: any) => !isStillOpen(poi));
  const openPOIs = data.filter((poi: any) => isStillOpen(poi));


  closedPOIs.forEach((poi: any) => {
    const marker = L.circleMarker([poi.y, poi.x], {
      renderer: canvasRenderer, // Use canvas renderer
      radius: 4,
      color: 'gray',
      fillOpacity: 0.5
    }).addTo(map);

    marker.bindPopup(`<b>${poi.name}</b><br>${formatDescription(poi)}`);
  });

  openPOIs.forEach((poi: any) => {
    const marker = L.circleMarker([poi.y, poi.x], {
      renderer: canvasRenderer, // Use canvas renderer
      radius: 4,
      color: 'lime',
      fillOpacity: 1
    }).addTo(map);

    marker.bindPopup(`<b>${poi.name}</b><br>${formatDescription(poi)}`);
  });
}

void main();