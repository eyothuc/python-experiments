"use client";
import React, { useEffect, useState } from "react";
import { TbBusStop } from "react-icons/tb";
import "leaflet/dist/leaflet.css";
import L, { LatLngTuple } from "leaflet";
import ReactDOMServer from "react-dom/server";
import Modal from "react-modal"; // React Modal
import axios from "axios";
import { useRouter } from "next/navigation";

import "react-leaflet-markercluster/dist/styles.min.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvent,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

interface Stop {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

interface Transport {
  route_id: number;
  vehicle_id: number;
  arrival: string;
}

Modal.setAppElement(document.body);
axios.defaults.withCredentials = true;

const MapComponent: React.FC = () => {
  const [locations, setLocations] = useState<
    { id: number; position: LatLngTuple; text: string }[]
  >([]);
  const [showedLocations, setShowedLocations] = useState<
    { id: number; position: LatLngTuple; text: string }[]
  >([]);
  const [selectedStopTransport, setSelectedStopTransport] = useState<
    Transport[] | null
  >(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkedLists, setCheckedLists] = useState<number[]>([]);
  const [stopLists, setStopLists] = useState<Record<number, number[]>>({});
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<number | null>(null);
  const [isAddListModalOpen, setAddListModalOpen] = useState(false); // Состояние для нового модального окна
  const [newListName, setNewListName] = useState(""); // Название нового списка
  const router = useRouter();

  // const createAxiosInstance = () => {
  //   const instance = axios.create({
  //     withCredentials: true, // Включаем отправку куки
  //   });
  //   return instance;
  // };

  // const axiosInstance = createAxiosInstance();

  // Обновление видимых остановок при перемещении карты
  const MapEventHandler: React.FC = () => {
    const map = useMapEvent("moveend", () => {
      if (map.getZoom() >= 15) {
        setShowedLocations(
          locations.filter(
            (loc) =>
              loc.position[0] <= map.getBounds().getNorthEast().lat &&
              loc.position[0] >= map.getBounds().getSouthWest().lat &&
              loc.position[1] <= map.getBounds().getNorthEast().lng &&
              loc.position[1] >= map.getBounds().getSouthWest().lng
          )
        );
      }
    });
    return null;
  };

  function calculateArrivalTime(arrivalTime: string): string {
    const arrivalDate = new Date(arrivalTime);
    const now = new Date();
    const diffInMs = arrivalDate.getTime() - now.getTime();
    if (diffInMs <= 0) return "Уже прибыл";

    const diffInMinutes = Math.ceil(diffInMs / (1000 * 60));
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;

    return hours > 0 ? `${hours} ч ${minutes} мин` : `${minutes} мин`;
  }

  // Получение остановок
  useEffect(() => {
    // Получаем текущего пользователя из localStorage
    setCurrentUser(localStorage.getItem("currentUser"));
    const fetchStops = async () => {
      try {
        const response = await axios.get(`/api/stops`, {
          withCredentials: true,
        });
        const stops: Stop[] = response.data;

        const newLocations = stops.map((stop) => ({
          id: stop.id,
          position: [stop.lat, stop.lon] as LatLngTuple,
          text: stop.name,
        }));
        setLocations(newLocations);
      } catch (error) {
        console.error("Ошибка при получении остановок:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStops();
  }, []);

  // Создание кастомной иконки
  const createCustomMarker = () => {
    const iconElement = <TbBusStop size={32} color="white" />;
    return L.divIcon({
      className: "bg-blue-500 rounded-md",
      html: ReactDOMServer.renderToString(iconElement),
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
  };

  const customIcon = createCustomMarker();

  const toggleListSelection = (id: number) => {
    setCheckedLists((prev) =>
      prev.includes(id) ? prev.filter((listId) => listId !== id) : [...prev, id]
    );
  };

  // Обработчик клика по маркеру
  const handleMarkerClick = (id: number) => {
    const fetchTransport = async () => {
      try {
        const response = await axios.get(`/api/stops/${id}`);
        const transportList: Transport[] = response.data;
        setSelectedStopTransport(transportList);
      } catch (error) {
        console.error("Ошибка при получении транспорта:", error);
      }
    };

    fetchTransport();
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser"); // Remove the user from localStorage
    setCurrentUser(null); // Update the state to reflect the logout
    router.push("/login"); // Redirect to the login page
  };

  const addToList = (stopId: number) => {
    if (selectedList !== null) {
      setStopLists((prev) => ({
        ...prev,
        [selectedList]: [...(prev[selectedList] || []), stopId],
      }));
    }
  };

  // Добавление нового списка
  const handleAddNewList = () => {
    const addList = async (name: string) => {
      try {
        const response = await axios.post(`/api/lists`, { name });
        const newListId = response.data.id; // Предполагаем, что сервер возвращает ID нового списка
        setCheckedLists((prev) => [...prev, newListId]);
        alert("Список успешно создан!");
      } catch (error) {
        console.error("Ошибка при создании списка:", error);
        alert("Ошибка при создании списка. Пожалуйста, попробуйте снова.");
      }
    };

    if (newListName.trim()) {
      addList(newListName);
      setNewListName(""); // Сбрасываем ввод
      setAddListModalOpen(false); // Закрываем модальное окно
    } else {
      alert("Пожалуйста, введите название списка.");
    }
  };

  return (
    <div className="relative h-screen w-screen">
      {loading && (
        <div className="absolute top-0 left-0 w-full h-full bg-gray-800 bg-opacity-50 flex justify-center items-center z-[1000]">
          <div className="spinner border-4 border-t-transparent border-white rounded-full w-12 h-12 animate-spin"></div>
        </div>
      )}

      {/* Отображение имени текущего пользователя */}
      {currentUser ? (
        <div className="absolute top-5 left-20 bg-white p-2 shadow-md rounded-lg z-[1000]">
          <div className="flex gap-4">
            <p className="text-sm font-semibold">Пользователь: {currentUser}</p>
            <button
              onClick={handleLogout}
              className="text-sm text-black border-black border p-1"
            >
              Выйти
            </button>
          </div>
          <button
            onClick={() => setModalIsOpen(true)}
            className="mt-2 bg-blue-500 text-white py-1 px-3 rounded-lg hover:bg-blue-600 w-full"
          >
            Открыть профиль
          </button>
        </div>
      ) : (
        <div className="absolute top-5 left-20 bg-white p-2 shadow-md rounded-lg z-[1000]">
          <p className="text-sm font-semibold">Вы не авторизованы</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => router.push("/login")}
              className="bg-blue-500 text-white py-1 px-3 rounded-lg hover:bg-blue-600"
            >
              Вход
            </button>
            <button
              onClick={() => router.push("/register")}
              className="bg-green-500 text-white py-1 px-3 rounded-lg hover:bg-green-600"
            >
              Регистрация
            </button>
          </div>
        </div>
      )}

      {/* Список транспорта */}
      {selectedStopTransport && (
        <div className="absolute top-5 right-10 overflow-y-auto h-96 bg-white shadow-lg rounded-lg p-4 z-[1000] max-w-sm">
          <h4 className="text-lg font-bold text-center mb-3">
            Транспорт на остановке
          </h4>
          <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
            {selectedStopTransport.map((transport) => (
              <li
                key={transport.vehicle_id}
                style={{
                  borderBottom: "1px solid #ddd",
                  padding: "5px 0",
                  fontSize: "14px",
                }}
              >
                <strong>Маршрут:</strong> {transport.route_id} <br />
                <strong>Транспорт:</strong> {transport.vehicle_id} <br />
                <strong>Прибывает через:</strong>{" "}
                {calculateArrivalTime(transport.arrival)}
              </li>
            ))}
          </ul>

          <button
            onClick={() => setSelectedStopTransport(null)}
            className="mt-3 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          >
            Закрыть
          </button>
        </div>
      )}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="User Info"
        className="modal bg-white rounded-lg shadow-lg p-5 max-w-3xl mx-auto z-[1001] mt-10"
        overlayClassName="overlay fixed inset-0 bg-black bg-opacity-50 flex justify-center z-[1001] items-center"
      >
        <h2 className="text-xl font-bold mb-3 text-center">
          Профиль пользователя
        </h2>
        <p className="text-sm mb-4">
          <strong>Имя:</strong> {currentUser}
        </p>

        <div>
          <h3 className="text-lg font-bold mb-2">Выбор списков:</h3>
          <ul className="grid grid-cols-2 gap-4">
            {locations.map((loc) => (
              <li key={loc.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={checkedLists.includes(loc.id)}
                  onChange={() => toggleListSelection(loc.id)}
                  className="mr-2"
                />
                <span>{loc.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => setModalIsOpen(false)}
          className="mt-5 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
        >
          Закрыть
        </button>
      </Modal>

      <Modal
        isOpen={isAddListModalOpen}
        onRequestClose={() => setAddListModalOpen(false)}
        contentLabel="Add New List"
        className="modal bg-white rounded-lg shadow-lg p-5 max-w-md mx-auto z-[1001]"
        overlayClassName="overlay fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1001]"
      >
        <h2 className="text-lg font-bold mb-4">Добавить новый список</h2>
        <input
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="Введите название списка"
          className="border rounded-md w-full p-2 mb-4"
        />
        <button
          onClick={handleAddNewList}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
        >
          Добавить
        </button>
      </Modal>

      <MapContainer
        center={[59.938784, 30.314997]}
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapEventHandler />
        <MarkerClusterGroup>
          {showedLocations.map((location) => (
            <Marker
              key={location.id}
              position={location.position}
              icon={customIcon}
              eventHandlers={{
                click: () => handleMarkerClick(location.id), // Обработчик клика на маркере
              }}
            >
              <Popup>
                <div>
                  <p className="font-bold">{location.text}</p>
                  <div className="mt-2">
                    <label
                      htmlFor={`select-list-${location.id}`}
                      className="block mb-1"
                    >
                      Выберите список:
                    </label>
                    <select
                      id={`select-list-${location.id}`}
                      className="border rounded-md p-1 w-full"
                      onChange={(e) => setSelectedList(Number(e.target.value))}
                    >
                      <option value="">-- Выбрать список --</option>
                      {checkedLists.map((listId) => (
                        <option key={listId} value={listId}>
                          Список {listId}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setAddListModalOpen(true)}
                      className="mt-2 bg-green-500 text-white py-1 px-3 rounded-lg hover:bg-green-600 w-full z-[1000]"
                    >
                      Создать новый список
                    </button>
                    <button
                      className="mt-2 bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 w-full"
                      onClick={() => addToList(location.id)} // Кнопка добавления в список
                    >
                      Добавить в список
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default MapComponent;
