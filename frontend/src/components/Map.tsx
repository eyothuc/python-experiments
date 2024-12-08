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
  transport_type: string;
  arrival: number;
}

interface Transport {
  route_id: number;
  vehicle_id: number;
  arrival: number;
}

interface UserList {
  id: number;
  name: string;
  stops: Stop[];
}

Modal.setAppElement(document.body);
axios.defaults.withCredentials = true;

const MapComponent: React.FC = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [locations, setLocations] = useState<
    { id: number; position: LatLngTuple; text: string }[]
  >([]);
  const [showedLocations, setShowedLocations] = useState<
    { id: number; position: LatLngTuple; text: string }[]
  >([]);
  const [selectedStopTransport, setSelectedStopTransport] = useState<
    any[] | null
  >(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkedLists, setCheckedLists] = useState<number[]>([]);
  const [selectedStops, setSelectedStops] = useState<number[]>();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<number | null>(null);
  const [isAddListModalOpen, setAddListModalOpen] = useState(false); // Состояние для нового модального окна
  const [newListName, setNewListName] = useState(""); // Название нового списка
  const [userLists, setUserLists] = useState<any>([]); // Списки пользователя
  const router = useRouter();

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

  const toggleStopSelection = (stopId: number) => {
    setSelectedStops((prev: any) =>
      prev.includes(stopId)
        ? prev.filter((id: number) => id !== stopId)
        : [...prev, stopId]
    );
  };

  useEffect(() => {
    if (userLists) {
      const selectedStopIds = userLists
        .filter((list: any) => checkedLists.includes(list.list_info.id))
        .flatMap((list: any) =>
          list.list_info.stops.map((stop: any) => stop.id)
        );
      setSelectedStops(selectedStopIds);
    }
  }, [checkedLists, userLists]);

  function calculateArrivalTime(arrivalTime: number): string {
    const arrivalDate = arrivalTime * 1000; // Преобразуем время в секундах в миллисекунды
    const now = new Date();
    const diffInMs = arrivalDate - now.getTime(); // Вычисляем разницу в миллисекундах

    console.log(diffInMs, now.getTime(), arrivalDate);

    if (diffInMs <= 0) return "Уже прибыл";

    const diffInMinutes = Math.ceil(diffInMs / (1000 * 60)); // Преобразуем разницу в минуты
    const hours = Math.floor(diffInMinutes / 60); // Вычисляем количество часов
    const minutes = diffInMinutes % 60; // Вычисляем количество минут

    return hours > 0 ? `${hours} ч ${minutes} мин` : `${minutes} мин`;
  }

  const fetchStops = async (retryCount = 3, delay = 2000) => {
    let attempts = 0; // Счётчик попыток
    let success = false;

    while (attempts < retryCount && !success) {
      try {
        const response = await axios.get(`${API_URL}/api/stops`, {
          withCredentials: true,
        });

        if (response.status === 200) {
          const stops: Stop[] = response.data;

          const newLocations = stops.map((stop) => ({
            id: stop.id,
            position: [stop.lat, stop.lon] as LatLngTuple,
            text: stop.name,
          }));
          setLocations(newLocations);
          success = true; // Запрос выполнен успешно
        } else {
          console.error(
            `Попытка ${attempts + 1}: код ответа ${response.status}`
          );
        }
      } catch (error) {
        console.error(`Попытка ${attempts + 1}: ошибка запроса`, error);
      }

      if (!success) {
        attempts++;
        if (attempts < retryCount) {
          console.log(`Повторная попытка через ${delay / 1000} секунд...`);
          await new Promise((res) => setTimeout(res, delay)); // Задержка перед повтором
        }
      }
    }

    if (!success) {
      console.error("Ошибка: данные остановок не удалось загрузить.");
    } else {
      setLoading(false); // Успешно завершённый запрос отключает загрузку
    }
  };

  const fetchUserLists = async (username: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/lists`);
      console.log(response);
      setUserLists(response.data);
    } catch (error) {
      console.error("Ошибка при получении списков пользователя:", error);
    }
  };

  const createUserList = async (name: string) => {
    if (!currentUser) return;
    try {
      await axios.post(`${API_URL}/api/lists`, {
        name,
      });
      const response = await axios.get(`${API_URL}/api/lists`);
      setUserLists(response.data);
    } catch (error) {
      console.error("Ошибка при создании списка:", error);
    }
  };

  const addStopToList = async (listId: number, stopId: number) => {
    if (!currentUser) return;
    let tries = 0;
    const newInterval = setInterval(async () => {
      try {
        const response = await axios.post(
          `${API_URL}/api/lists/${listId}/add`,
          {
            username: currentUser,
            stopId,
          }
        );
        tries = 10;

        if (currentUser) fetchUserLists(currentUser);
      } catch (error) {
        tries++;

        console.error("Ошибка при добавлении остановки в список:", error);
      } finally {
        if (tries >= 10) {
          clearInterval(newInterval);
        }
      }
    }, 2000);
  };

  // Вызов в useEffect
  useEffect(() => {
    const username = localStorage.getItem("currentUser");
    console.log(username);
    setCurrentUser(localStorage.getItem("currentUser"));

    if (username) {
      fetchUserLists(username);
      setInterval(() => {
        fetchUserLists(username);
      }, 60000);
    }

    setLoading(true); // Показываем загрузку перед выполнением запросов
    fetchStops(); // Запуск функции с повторными попытками
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
        const response = await axios.get(`${API_URL}/api/stops/${id}`);
        const transportList: Transport[] = response.data;
        setSelectedStopTransport(transportList);
      } catch (error) {
        console.error("Ошибка при получении транспорта:", error);
      }
    };

    fetchTransport();
  };

  const handleLogout = async () => {
    localStorage.removeItem("currentUser"); // Remove the user from localStorage
    const response = await axios.post(`${API_URL}/api/auth/logout`);
    setCurrentUser(null); // Update the state to reflect the logout
    router.push("/login"); // Redirect to the login page
  };

  const addToList = (stopId: number) => {
    if (selectedList !== null) {
      addStopToList(selectedList, stopId);
    }
  };

  // Добавление нового списка
  const handleAddNewList = () => {
    if (newListName.trim()) {
      createUserList(newListName);
      setNewListName(""); // Сбрасываем ввод
      setAddListModalOpen(false); // Закрываем модальное окно
      if (currentUser) fetchUserLists(currentUser);
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
          <h4 className="font-bold text-center mb-3">Транспорт на остановке</h4>
          <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
            {selectedStopTransport.map((transport) => {
              console.log(transport);
              return (
                <li
                  key={transport.vehicle_id}
                  style={{
                    borderBottom: "1px solid #ddd",
                    padding: "5px 0",
                    fontSize: "14px",
                  }}
                >
                  <strong>Номер транспорта:</strong>{" "}
                  {transport.route_short_name} <br />
                  <strong>Прибывает через:</strong>{" "}
                  {calculateArrivalTime(transport.arrival)}
                </li>
              );
            })}
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
        className="modal bg-white rounded-lg max-h-[90%] overflow-y-auto overflow-x-hidden shadow-lg p-5 w-[1000px] border-gray-600 border mx-auto z-[1001] mt-10"
        overlayClassName="overlay fixed inset-0 bg-black bg-opacity-50 flex justify-center z-[1001] items-center"
      >
        <h2 className="text-xl font-bold mb-3 text-center">Профиль</h2>
        <p className="text-sm mb-4">
          <strong>Имя:</strong> {currentUser}
        </p>

        <div className="w-full">
          <h3 className="text-lg font-bold mb-2">Списки пользователя:</h3>
          <ul className="grid grid-cols-2 gap-4 w-full">
            {userLists &&
              userLists.map((list: any) => {
                return (
                  <li
                    key={list.list_info.id}
                    className="flex flex-col gap-2 items-center w-full border-gray-600 border p-2 rounded-lg bg-zinc-100"
                  >
                    <div className="flex w-full">
                      <input
                        type="checkbox"
                        checked={checkedLists.includes(list.list_info.id)}
                        onChange={() => toggleListSelection(list.list_info.id)}
                        className="mr-2"
                      />
                      <span className="font-bold text-xl">
                        {list.list_info.name}
                      </span>
                    </div>
                    {list.list_info.stops.length > 0 && (
                      <ul className="w-full flex flex-col mt-2 border-t border-gray-300 pt-2">
                        {list.list_info.stops.map((stop: any, id: number) => (
                          <li key={stop.id} className="flex flex-col gap-1">
                            <span className="text-lg border-y border-gray-600 py-2">
                              {stop.name}
                            </span>
                            <div className="flex flex-col text-sm gap-1 my-2">
                              {list.stops[id].map((t: any) => {
                                return (
                                  <div key={t.route_id}>{`${
                                    stop.transport_type === "bus"
                                      ? "Автобус"
                                      : "Троллейбус"
                                  } ${
                                    t.route_short_name
                                  } - ${calculateArrivalTime(t.arrival)}`}</div>
                                );
                              })}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
          </ul>
          <button
            onClick={() => setAddListModalOpen(true)}
            className="w-full mt-4 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
          >
            Создать новый список
          </button>
        </div>

        <button
          onClick={() => setModalIsOpen(false)}
          className="mt-2 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
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
          {(selectedStops && selectedStops.length > 0
            ? locations.filter((location) =>
                selectedStops.includes(location.id)
              )
            : showedLocations
          ).map((location) => (
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
                      {userLists?.map((list: any) => (
                        <option
                          key={list.list_info.id}
                          value={list.list_info.id}
                        >
                          {list.list_info.name}
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
