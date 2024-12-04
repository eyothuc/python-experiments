import { NextResponse } from "next/server";
import axios from "axios";

// Обработчик GET-запросов для получения списков пользователя
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;

  try {
    // Отправляем запрос на сервер для получения списков пользователя
    const response = await axios.get(
      `https://trashapigtfs.loca.lt/api/lists/user/${username}`
    );

    // Возвращаем списки как JSON
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Возвращаем ошибку
    return NextResponse.json(
      { message: "Ошибка при получении данных", error: error.message },
      { status: 500 }
    );
  }
}

// Обработчик POST-запросов для добавления нового списка пользователю
export async function POST(
  request: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;

  try {
    // Читаем тело запроса
    const { name } = await request.json();

    // Отправляем запрос на сервер для добавления списка
    const response = await axios.post(
      `https://trashapigtfs.loca.lt/api/lists/user/${username}`,
      { name }
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
