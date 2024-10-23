"use client";
import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { FaMapMarkerAlt } from "react-icons/fa"; // Импорт иконки
import "leaflet/dist/leaflet.css";
import L, { LatLngTuple } from "leaflet"; // Импорт Leaflet
import ReactDOMServer from "react-dom/server"; // Импорт для рендеринга React в строку

const MapComponent: React.FC = () => {
  // Массив координат и текстов для Popup
  const locations: { position: LatLngTuple; text: string }[] = [
    { position: [51.505, -0.09], text: "London" },
    { position: [51.515, -0.1], text: "Marker 2" },
    { position: [51.525, -0.08], text: "Marker 3" },
    { position: [51.535, -0.07], text: "Marker 4" },
    { position: [51.545, -0.06], text: "Marker 5" },
    { position: [51.555, -0.05], text: "Marker 6" },
    { position: [51.565, -0.04], text: "Marker 7" },
    { position: [51.575, -0.03], text: "Marker 8" },
    { position: [51.585, -0.02], text: "Marker 9" },
    { position: [51.595, -0.01], text: "Marker 10" },
  ];

  // Создание кастомной иконки с использованием react-icons
  const createCustomMarker = () => {
    const iconElement = <FaMapMarkerAlt size={30} color="red" />;
    return L.divIcon({
      className: "custom-marker",
      html: ReactDOMServer.renderToString(iconElement),
      iconSize: [30, 30], // Размер иконки
      iconAnchor: [15, 30], // Центрирование иконки
    });
  };

  const customIcon = createCustomMarker(); // Создаем иконку один раз

  function handleMarkerClick(text: string): void {
    console.log(text);
  }

  return (
    <MapContainer
      center={[51.505, -0.09]} // Центр карты
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {locations.map((location, index) => (
        <Marker
          key={index}
          position={location.position}
          icon={customIcon}
          eventHandlers={{
            click: () => handleMarkerClick(location.text), // Обработчик события onClick'
          }}
        >
          <Popup>{location.text}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
