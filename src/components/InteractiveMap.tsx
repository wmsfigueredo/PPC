import  'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Point } from '../types';

// Ícone customizado de patinha usando divIcon do Leaflet
const createPinIcon = (status: string, isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div class="marker m-${status} ${isSelected ? 'active' : ''}">🐾</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

// Ícone para quando o usuário clicar para marcar novo ponto
const newPointIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div class="marker m-blue active">📍</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
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

        return (
          <Marker
            key={pt.id}
            position={[Number(pt.lat), Number(pt.lng)]}
            icon={createPinIcon(pt.status, isSelected)}
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