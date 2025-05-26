"use client";

import { useState, useEffect, useRef } from 'react';

export default function YandexMap({ apiKey, center = [37.6176, 55.7558], zoom = 10, markerCoords = [37.6176, 55.7558],
  markerContent = 'Метка'
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const [currentCenter, setCurrentCenter] = useState(center);
  const [currentZoom, setCurrentZoom] = useState(zoom);

  // Инициализация карты один раз при монтировании
  useEffect(() => {
    if (window.ymaps) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;
    
    script.onload = () => {
      initMap();
      // Добавляем обработчики изменений
      window.ymaps.ready(() => {
        window.ymaps.geolocation.get({
          provider: 'browser',
          mapStateAutoApply: true
        });
      });
    };

    document.body.appendChild(script);

    function initMap() {
      window.ymaps.ready(() => {
        if (!mapRef.current) return;

        // Создаем карту только если ее еще нет
        if (!mapInstance.current) {
          mapInstance.current = new window.ymaps.Map(mapRef.current, {
            center: currentCenter,
            zoom: currentZoom
          });

          // Добавляем метку
          createMarker();

          // Следим за изменениями позиции
          mapInstance.current.events.add('boundschange', (e) => {
            const newCenter = e.get('newCenter');
            const newZoom = e.get('newZoom');
            setCurrentCenter(newCenter);
            setCurrentZoom(newZoom);
          });
        }
      });
    }

    function createMarker() {
      if (markerInstance.current) {
        mapInstance.current.geoObjects.remove(markerInstance.current);
      }

      markerInstance.current = new window.ymaps.Placemark(
        markerCoords,
        { balloonContent: markerContent },
        { preset: 'islands#redIcon' }
      );

      mapInstance.current.geoObjects.add(markerInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, [apiKey]); // Зависимости только от apiKey

  // Обновляем метку при изменении координат
  useEffect(() => {
    if (mapInstance.current && markerInstance.current) {
      markerInstance.current.geometry.setCoordinates(markerCoords);
    }
  }, [markerCoords, markerContent]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '400px',
        borderRadius: '8px',
        overflow: 'hidden'
      }} 
    />
  );
}