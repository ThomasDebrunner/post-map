import './style.css'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import data from '../pois.json'



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

  
  const greenIcon = L.icon({
    iconUrl: '/markers/marker-icon-2x-green.png',
    shadowUrl: '/markers/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const grayIcon = L.icon({
    iconUrl: '/markers/marker-icon-2x-grey.png',
    shadowUrl: '/markers/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  data.forEach((poi: any) => {
    const marker = L.marker([poi.y, poi.x], {
      icon: isStillOpen(poi) ? greenIcon : grayIcon
    }).addTo(map);
    marker.bindPopup(`<b>${poi.name}</b><br>${formatDescription(poi)}`);
  });

}


void main()