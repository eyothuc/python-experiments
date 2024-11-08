"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { TbBusStop } from "react-icons/tb";
import "leaflet/dist/leaflet.css";
import L, { LatLngTuple } from "leaflet";
import ReactDOMServer from "react-dom/server";
import axios from "axios";
import "react-leaflet-markercluster/dist/styles.min.css"; // Импорт стилей кластера

interface Stop {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

// Динамический импорт компонентов react-leaflet
const MapContainerDynamic = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayerDynamic = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const MarkerDynamic = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const PopupDynamic = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const MarkerClusterGroupDynamic = dynamic(
  () => import("react-leaflet-cluster").then((mod) => mod.default),
  { ssr: false }
);

const MapComponent: React.FC = () => {
  const [locations, setLocations] = useState<
    { position: LatLngTuple; text: string }[]
  >([]);

  // Функция для получения станций
  useEffect(() => {
    const fetchStops = async () => {
      try {
        const response = await axios.get("/api/getStops");
        const stops: Stop[] = response.data;

        const newLocations = stops.map((stop) => ({
          position: [stop.lat, stop.lon] as LatLngTuple,
          text: stop.name,
        }));
        setLocations(newLocations);
      } catch (error) {
        console.error("Ошибка при получении станций:", error);
      }
    };
    fetchStops();
  }, []);

  // Создание кастомной иконки с использованием react-icons
  const createCustomMarker = () => {
    const iconElement = <TbBusStop size={30} color="black" />;
    return L.divIcon({
      className: "custom-marker",
      html: ReactDOMServer.renderToString(iconElement),
      iconSize: [30, 30], // Размер иконки
      iconAnchor: [15, 30], // Центрирование иконки
    });
  };

  const customIcon = createCustomMarker(); // Создаем иконку один раз

  function handleMarkerClick(text: string): void {
    console.log(`Маркер был нажат: ${text}`);
  }

  return (
    <MapContainerDynamic
      center={[59.938784, 30.314997]} // Центр карты
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayerDynamic url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Исправляем типизацию для MarkerClusterGroup */}
      <MarkerClusterGroupDynamic>
        {locations.map((location, index) => (
          <MarkerDynamic
            key={index}
            position={location.position}
            icon={customIcon}
            eventHandlers={{
              click: () => handleMarkerClick(location.text),
            }}
          >
            <PopupDynamic>{location.text}</PopupDynamic>
          </MarkerDynamic>
        ))}
      </MarkerClusterGroupDynamic>
    </MapContainerDynamic>
  );
};

export default MapComponent;
