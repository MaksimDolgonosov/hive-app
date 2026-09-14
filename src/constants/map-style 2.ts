export const HIVE_DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0B0A08' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9C9287' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0B0A08' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#201C16' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#15130F' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6A6158' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1C2A12' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#201C16' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0B0A08' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6A6158' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2A241C' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#15130F' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#080706' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6A6158' }] },
];

/** Empty JSON resets Android Google Maps; `undefined` is ignored natively. */
export const HIVE_LIGHT_MAP_STYLE: typeof HIVE_DARK_MAP_STYLE = [];
