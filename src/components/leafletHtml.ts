import type { Location } from '@/lib/db';

export type LeafletMapProps = {
  locations: Location[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  height?: number;
};

export function buildLeafletHtml(locations: Location[]): string {
  const points = locations
    .filter((l) => l.lat != null && l.lng != null)
    .map((l) => ({
      id: l.id,
      name: l.name,
      lat: l.lat,
      lng: l.lng,
      needed: l.needed_goods ?? [],
    }));

  const data = JSON.stringify(points).replace(/</g, '\\u003c');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #e8f0e6; }
  .bamx-pin { font-size: 26px; line-height: 26px; text-align: center; }
  .bamx-pin.sel { font-size: 36px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var locs = ${data};

  var map = L.map('map', { zoomControl: true }).setView([20.66, -103.35], 11);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  function post(id) {
    var msg = JSON.stringify({ type: 'select', id: id });
    if (window.ReactNativeWebView) { window.ReactNativeWebView.postMessage(msg); }
    else if (window.parent) { window.parent.postMessage(msg, '*'); }
  }

  var icon = L.divIcon({
    html: '<div class="bamx-pin">📍</div>',
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 28]
  });

  var markers = [];
  var byId = {};
  locs.forEach(function (l) {
    var m = L.marker([l.lat, l.lng], { icon: icon }).addTo(map);
    var popup = '<b>' + l.name + '</b>' +
      (l.needed && l.needed.length ? '<br/>Necesita: ' + l.needed.join(', ') : '');
    m.bindPopup(popup);
    m.on('click', function () { m.openPopup(); post(l.id); });
    markers.push(m);
    byId[l.id] = m;
  });

  if (markers.length) {
    var group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.25));
  }

  function focusLocation(id) {
    var m = byId[id];
    if (!m) return;
    map.setView(m.getLatLng(), Math.max(map.getZoom(), 15), { animate: true });
    m.openPopup();
  }
  window.focusLocation = focusLocation;
  window.addEventListener('message', function (e) {
    try {
      var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (d && d.type === 'focus') focusLocation(d.id);
    } catch (_) {}
  });
</script>
</body>
</html>`;
}
