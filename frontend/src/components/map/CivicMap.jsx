import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { useMapStore } from '../../store';
import { MAP_CONFIG, getIssueColor, getStatusBadge } from '../../utils/constants';
import { ThumbsUp, Clock, MapPin } from 'lucide-react';

// Custom colored marker icon factory
function createMarkerIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
      background: ${color}; transform: rotate(-45deg);
      border: 3px solid rgba(255,255,255,0.9);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    "><div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

function HeatmapOverlay({ reports }) {
  const map = useMap();
  const heatLayerRef = useRef(null);
  useEffect(() => {
    if (!map || !reports.length) return;
    if (heatLayerRef.current) map.removeLayer(heatLayerRef.current);
    const points = reports.map(r => [
      parseFloat(r.latitude), parseFloat(r.longitude),
      (r.priority_score || 1) / 30,
    ]);
    heatLayerRef.current = L.heatLayer(points, {
      radius: 40, blur: 25, maxZoom: 17, max: 1.0, minOpacity: 0.4,
      gradient: { 0.1: '#ffe066', 0.3: '#ffa500', 0.5: '#ff6600', 0.7: '#ff2200', 0.9: '#cc0000', 1.0: '#7f0000' },
    }).addTo(map);
    return () => { if (heatLayerRef.current) map.removeLayer(heatLayerRef.current); };
  }, [map, reports]);
  return null;
}

function MapEvents() {
  const map = useMap();
  const { setCenter, setZoom } = useMapStore();
  useEffect(() => {
    map.on('moveend', () => {
      const c = map.getCenter();
      setCenter([c.lat, c.lng]);
      setZoom(map.getZoom());
    });
  }, [map, setCenter, setZoom]);
  return null;
}

export default function CivicMap({ reports = [], loading = false }) {
  const { center, zoom, selectReport, showHeatmap } = useMapStore();

  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/60">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-6 h-6 border-2 border-gov-600 border-t-transparent rounded-full animate-spin" /> Loading map...
          </div>
        </div>
      )}

      <MapContainer center={center} zoom={zoom} className="w-full h-full" zoomControl={false} style={{ background: '#f5f5f5' }}>
        <TileLayer url={MAP_CONFIG.tileUrl} attribution={MAP_CONFIG.tileAttribution} />
        <MapEvents />

        {showHeatmap && <HeatmapOverlay reports={reports} />}

        {!showHeatmap && reports.map(report => {
          const lat = parseFloat(report.latitude);
          const lng = parseFloat(report.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker key={report.id} position={[lat, lng]} icon={createMarkerIcon(getIssueColor(report.issue_type))}
              eventHandlers={{ click: () => selectReport(report) }}>
              <Popup maxWidth={280} className="civic-popup">
                <div className="p-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: getIssueColor(report.issue_type) }} />
                    <span className="font-semibold text-sm text-gray-900 capitalize">{report.issue_type?.replace('_', ' ')}</span>
                    <span className={`badge text-[10px] ml-auto ${report.status === 'resolved' ? 'badge-resolved' : 'badge-pending'}`}>
                      {getStatusBadge(report.status).label}
                    </span>
                  </div>
                  {report.description && <p className="text-xs text-gray-600 mb-2 line-clamp-2">{report.description}</p>}
                  {report.address_text && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-2"><MapPin className="w-3 h-3" />{report.address_text}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{report.upvote_count || 0}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
