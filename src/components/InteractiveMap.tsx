import  'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Point } from '../types';

const isSupplyFull = (status: Point['water_status'], fallbackValue: boolean) =>
  status == null ? fallbackValue : status === 'cheio';

const createPinIcon = (
  waterIsFull: boolean,
  foodIsFull: boolean,
  isSelected: boolean
) => {
  const waterLabel = waterIsFull ? 'cheia' : 'vazia';
  const foodLabel = foodIsFull ? 'cheia' : 'vazia';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div
        class="leaflet-supply-pin ${isSelected ? 'active' : ''}"
        role="img"
        aria-label="Água ${waterLabel}; ração ${foodLabel}"
      >
        <span class="leaflet-supply-indicators">
          <span class="leaflet-supply-indicator" title="Água ${waterLabel}">
          <svg class="leaflet-supply-water-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 1.5C6.3 4.1 3.5 6.7 3.5 9.5a4.5 4.5 0 0 0 9 0C12.5 6.7 9.7 4.1 8 1.5Z" />
          </svg>
          <span class="leaflet-supply-light ${waterIsFull ? 'is-full' : 'is-empty'}"></span>
          </span>
          <span class="leaflet-supply-indicator" title="Ração ${foodLabel}">
          <svg class="leaflet-supply-food-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 6.5h12l-1.2 7H3.2l-1.2-7Z" />
            <path d="M4 4.5c.8-1 1.6-1 2.4 0m1.2 0c.8-1 1.6-1 2.4 0m1.2 0c.8-1 1.6-1 2.4 0" />
          </svg>
          <span class="leaflet-supply-light ${foodIsFull ? 'is-full' : 'is-empty'}"></span>
          </span>
        </span>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21],
  });
};

// Ícone para quando o usuário clicar para marcar novo ponto
const newPointIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<svg class="map-create-pin" viewBox="0 0 24 32" aria-hidden="true"><path d="M12 1C5.9 1 1 5.9 1 12c0 8.2 11 19 11 19s11-10.8 11-19C23 5.9 18.1 1 12 1Z" fill="#2563eb"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
});

interface MapProps {
  points: Point[];
  currentPoint?: Point | null;
  onSelectPoint?: (point: Point) => void;
  selectedCoords?: { lat: number; lng: number } | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}

function ClickHandler({ onMapClick }: { onMapClick?: (coords: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

export default function InteractiveMap({
  points,
  currentPoint,
  onSelectPoint,
  selectedCoords,
  onMapClick,
}: MapProps) {
  // Centro padrão em Franca/SP
  const defaultCenter: [number, number] = [-20.5385, -47.4010];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={14}
      scrollWheelZoom={true}
      style={{ width: '100%', height: '100%', borderRadius: '8px' }}
    >
      {/* Camada do OpenStreetMap */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler onMapClick={onMapClick} />

      {/* Pontos já salvos no banco */}
      {points.map((pt) => {
        if (!pt.lat || !pt.lng) return null;
        const isSelected = currentPoint?.id === pt.id;
        const waterIsFull = isSupplyFull(pt.water_status, pt.water);
        const foodIsFull = isSupplyFull(pt.food_status, pt.food);

        return (
          <Marker
            key={pt.id}
            position={[Number(pt.lat), Number(pt.lng)]}
            icon={createPinIcon(waterIsFull, foodIsFull, isSelected)}
            eventHandlers={{
              click: () => onSelectPoint && onSelectPoint(pt),
            }}
          >
            <Popup>
              <strong>{pt.name}</strong> <br />
              {pt.address} <br />
              <small>Status: {pt.status_text}</small>
            </Popup>
          </Marker>
        );
      })}

      {/* Marcador temporário de clique para cadastro */}
      {selectedCoords && (
        <Marker position={[selectedCoords.lat, selectedCoords.lng]} icon={newPointIcon}>
          <Popup>Novo ponto selecionado aqui</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}