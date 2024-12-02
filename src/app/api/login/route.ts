import { NextResponse } from "next/server";
import axios from "axios";

// Обработчик POST-запросов для входа
export async function POST(request: Request) {
  try {
    const { username, password, is_remember } = await request.json();

    // Проверка на пустые поля
    if (!username || !password) {
      return NextResponse.json(
        { message: "Поля username и password должны быть заполнены" },
        { status: 400 }
      );
    }

    // Запрос к backend для входа
    const response = await axios.post(
      "https://trashapigtfs.loca.lt/api/auth/login",
      {
        username,
        password,
        is_remember,
      }
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.response?.data?.message || "Ошибка входа" },
      { status: error.response?.status || 500 }
    );
  }
}
