import { NextResponse } from "next/server";
import axios from "axios";

// Обработчик POST-запросов для регистрации
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Проверка на пустые поля
    if (!username || !password) {
      return NextResponse.json(
        { message: "Поля username и password должны быть заполнены" },
        { status: 400 }
      );
    }

    // Запрос к backend для регистрации
    const response = await axios.post(
      "https://trashapigtfs.loca.lt/api/auth/register",
      { username, password }
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.response?.data?.message || "Ошибка регистрации" },
      { status: error.response?.status || 500 }
    );
  }
}
