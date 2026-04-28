import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, X, Check } from 'lucide-react';

// Fix default Leaflet icon paths broken by Vite bundling
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
  lat: string;
  lng: string;
  onConfirm: (lat: string, lng: string, address?: string) => void;
  onClose: () => void;
}

const DEFAULT_LAT = 20.5937;
const DEFAULT_LNG = 78.9629;
const DEFAULT_ZOOM = 5;

export default function MapPicker({ lat, lng, onConfirm, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null
  );
  const [address, setAddress] = useState<string>('');
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  // Reverse geocode via Nominatim
  const reverseGeocode = async (lt: number, ln: number) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lt}&lon=${ln}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setAddress(data.display_name || '');
    } catch {
      setAddress('');
    } finally {
      setGeocoding(false);
    }
  };

  // Place/move marker
  const placeMarker = (lt: number, ln: number, map: L.Map) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lt, ln]);
    } else {
      markerRef.current = L.marker([lt, ln], {
        draggable: true,
        icon: DefaultIcon,
      }).addTo(map);

      markerRef.current.on('dragend', (e) => {
        const ll = (e.target as L.Marker).getLatLng();
        setPosition({ lat: ll.lat, lng: ll.lng });
        reverseGeocode(ll.lat, ll.lng);
      });
    }
    setPosition({ lat: lt, lng: ln });
    reverseGeocode(lt, ln);
  };

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const initLat = lat && lng ? parseFloat(lat) : DEFAULT_LAT;
    const initLng = lat && lng ? parseFloat(lng) : DEFAULT_LNG;
    const initZoom = lat && lng ? 14 : DEFAULT_ZOOM;

    const map = L.map(mapRef.current, {
      center: [initLat, initLng],
      zoom: initZoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Click to pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      placeMarker(e.latlng.lat, e.latlng.lng, map);
    });

    mapInstance.current = map;

    // Place initial marker outside sync effect body (satisfies lint)
    if (lat && lng) {
      setTimeout(() => placeMarker(initLat, initLng, map), 0);
    }

    return () => {
      map.remove();
      mapInstance.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Use device GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstance.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lt = pos.coords.latitude;
        const ln = pos.coords.longitude;
        mapInstance.current!.flyTo([lt, ln], 16, { duration: 1.5 });
        placeMarker(lt, ln, mapInstance.current!);
        setLocating(false);
      },
      () => {
        setLocating(false);
        alert('Location access denied. Please allow location in browser settings.');
      },
      { timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    if (!position) return;
    onConfirm(
      position.lat.toFixed(6),
      position.lng.toFixed(6),
      address
    );
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div style={{
        background: '#fff', borderRadius: 0, width: '100%', maxWidth: 780,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--green-600)', color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={20} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Pin Your Farm Location</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Click on the map or drag the marker to your exact location</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <button
            onClick={handleLocateMe}
            disabled={locating}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--green-500)', color: '#fff', border: 'none', borderRadius: 4, cursor: locating ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', opacity: locating ? 0.7 : 1 }}
          >
            <Navigation size={15} />
            {locating ? 'Getting location...' : 'Use My Location (GPS)'}
          </button>

          {position && (
            <div style={{ fontSize: 12, color: '#555', background: '#f5f5f5', padding: '6px 12px', borderRadius: 4, fontFamily: 'monospace' }}>
              📍 {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </div>
          )}
        </div>

        {/* Map container */}
        <div ref={mapRef} style={{ flex: 1, minHeight: 380 }} />

        {/* Address preview + confirm */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: '#fafafa' }}>
          {position && (
            <div style={{ fontSize: 13, color: '#555', marginBottom: 10, lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700, color: 'var(--green-600)' }}>📍 Detected address: </span>
              {geocoding ? <em style={{ color: '#aaa' }}>Loading address…</em> : (address || 'Address unavailable')}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 20px', background: '#fff', border: '1.5px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#555' }}>
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!position}
              style={{ padding: '9px 20px', background: position ? 'var(--green-600)' : '#ccc', color: '#fff', border: 'none', borderRadius: 4, cursor: position ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Check size={15} /> Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
