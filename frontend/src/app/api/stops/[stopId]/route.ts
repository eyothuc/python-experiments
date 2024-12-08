import { NextResponse } from "next/server";
import axios from "axios";

interface StopDetails {
  id: number;
  name: string;
  lat: number;
  lon: number;
  // Добавьте другие поля, если они есть
}

// Обработчик GET-запросов
export async function GET(
  req: Request,
  { params }: { params: { stopId: string } }
) {
  const { stopId } = params;

  try {
    if (!stopId) {
      return NextResponse.json(
        { message: "ID остановки не указан" },
        { status: 400 }
      );
    }

    // Делаем запрос на внешнее API для получения данных об указанной остановке
    const response = await axios.get<StopDetails>(
      `https://trashapigtfs.loca.lt/api/stops/${stopId}`
    );

    // Проверяем, что остановка найдена
    if (!response.data) {
      return NextResponse.json(
        { message: "Остановка не найдена" },
        { status: 404 }
      );
    }

    // Возвращаем данные об остановке
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Ошибка при получении данных об остановке:", error);

    // Обрабатываем ошибки и возвращаем статус 500
    return NextResponse.json(
      { message: "Ошибка при получении данных об остановке" },
      { status: 500 }
    );
  }
}
