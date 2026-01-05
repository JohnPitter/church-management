// Presentation Component - OpenStreetMap with Leaflet
// Free interactive map component using OpenStreetMap as an alternative to Google Maps

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
// Extend HTMLDivElement to include Leaflet's internal properties
interface LeafletContainer extends HTMLDivElement {
  _leaflet_id?: number;
}

let DefaultIcon = L.divIcon({
  html: `<div style="background-color: #dc2626; width: 25px; height: 25px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25],
  className: 'custom-div-icon'
});

interface OpenStreetMapProps {
  address?: string;
  latitude?: number;
  longitude?: number;
  zoom?: number;
  height?: string;
  churchName?: string;
}

export const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
  address = '',
  latitude,
  longitude,
  zoom = 15,
  height = '500px',
  churchName = 'Nossa Igreja'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    let currentMap: L.Map | null = null;
    let isMounted = true;

    const initializeMap = async () => {
      if (!isMounted || !mapRef.current) return;

      try {
        // Reset states
        setIsLoaded(false);
        setError(null);

        const container = mapRef.current as LeafletContainer;

        // Complete cleanup of any existing Leaflet instance
        if (container._leaflet_id) {
          // Force remove any existing Leaflet instance
          try {
            const existingMap = (window as any).L?.Map?.prototype?._getRegistry?.(container._leaflet_id);
            if (existingMap) {
              existingMap.remove();
            }
          } catch (e) {
            // Ignore errors in cleanup
          }
          delete container._leaflet_id;
        }

        // Clear container completely
        container.innerHTML = '';
        container.className = container.className.replace(/leaflet-[\w-]*/g, '').trim();
        container.removeAttribute('data-leaflet-id');
        
        // Remove all Leaflet-related attributes
        Array.from(container.attributes).forEach(attr => {
          if (attr.name.startsWith('data-leaflet')) {
            container.removeAttribute(attr.name);
          }
        });

        // Small delay to ensure DOM cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 50));

        if (!isMounted || !mapRef.current) return;

        // Default coordinates (São Paulo if no coordinates provided)
        let coords: [number, number] = [latitude || -23.5505, longitude || -46.6333];

        // If we have an address but no coordinates, try to geocode it
        if (address && (!latitude || !longitude)) {
          try {
            coords = await geocodeAddress(address);
          } catch (geocodeError) {
            console.warn('Erro na geocodificação:', geocodeError);
            // Keep default coordinates if geocoding fails
          }
        }

        if (!isMounted || !mapRef.current) return;

        // Create map with fresh container
        currentMap = L.map(container, {
          preferCanvas: true // Use canvas for better performance
        }).setView(coords, zoom);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(currentMap);

        // Add marker
        const marker = L.marker(coords, { icon: DefaultIcon }).addTo(currentMap);

        // Add popup to marker
        marker.bindPopup(`
          <div style="text-align: center; padding: 8px;">
            <h3 style="margin: 0 0 5px 0; color: #1f2937; font-size: 16px;">${churchName}</h3>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">${address || 'Nossa localização'}</p>
          </div>
        `);

        // Open popup by default
        marker.openPopup();

        if (isMounted) {
          setIsLoaded(true);
        }
      } catch (mapError) {
        console.error('Erro ao inicializar mapa:', mapError);
        if (isMounted) {
          setError('Erro ao carregar o mapa');
        }
        if (currentMap) {
          currentMap.remove();
          currentMap = null;
        }
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      isMounted = false;
      
      if (currentMap) {
        try {
          currentMap.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        currentMap = null;
      }
      
      // Clean up the container properly
      if (mapRef.current) {
        const container = mapRef.current as LeafletContainer;
        container.innerHTML = '';
        container.className = container.className.replace(/leaflet-[\w-]*/g, '').trim();
        
        // Remove all Leaflet-related attributes
        Array.from(container.attributes).forEach(attr => {
          if (attr.name.startsWith('data-leaflet')) {
            container.removeAttribute(attr.name);
          }
        });
        
        if (container._leaflet_id) {
          delete container._leaflet_id;
        }
      }
      
      setIsLoaded(false);
    };
  }, [address, latitude, longitude, zoom, churchName]);

  // Simple geocoding function using Nominatim (OpenStreetMap's geocoding service)
  const geocodeAddress = async (address: string): Promise<[number, number]> => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    
    if (!response.ok) {
      throw new Error('Erro na busca do endereço');
    }

    const data = await response.json();
    
    if (data.length === 0) {
      throw new Error('Endereço não encontrado');
    }

    const result = data[0];
    return [parseFloat(result.lat), parseFloat(result.lon)];
  };

  if (error) {
    return (
      <div 
        style={{ 
          height,
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}
      >
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🗺️</div>
          <p style={{ margin: '0', fontSize: '14px' }}>{error}</p>
          {address && (
            <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
              {address}
            </p>
          )}
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
            Mapa fornecido por OpenStreetMap
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height, borderRadius: '8px', overflow: 'hidden' }}>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          backgroundColor: '#f3f4f6'
        }} 
      />
      {!isLoaded && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🗺️</div>
            <p style={{ margin: '0', fontSize: '14px' }}>Carregando mapa...</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
              Mapa fornecido por OpenStreetMap
            </p>
          </div>
        </div>
      )}
    </div>
  );
};