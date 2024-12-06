import { NextResponse } from "next/server";
import axios from "axios";

// Обработчик POST-запросов для добавления остановки в список пользователя
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Читаем тело запроса
    const { username, stopId } = await request.json();

    // Отправляем запрос на сервер для добавления остановки в список
    const response = await axios.post(
      `https://trashapigtfs.loca.lt/api/lists/${id}/add`,
      { username, stopId }
    );

    // Возвращаем результат как JSON
    return NextResponse.json(response.data, { status: 201 });
  } catch (error: any) {
    // Возвращаем ошибку
    return NextResponse.json(
      { message: "Ошибка при добавлении данных", error: error.message },
      { status: 500 }
    );
  }
}
