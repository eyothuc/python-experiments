import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    // Извлекаем куки из запроса
    const cookies = request.headers.get("cookie");

    if (!cookies) {
      return NextResponse.json(
        { message: "Нет доступных куков для выполнения запроса" },
        { status: 400 }
      );
    }

    // Отправляем запрос с куками
    const response = await axios.post(
      "https://trashapigtfs.loca.lt/api/lists",
      { name },
      {
        headers: {
          Cookie: cookies, // Передача куков
        },
        withCredentials: true, // Включаем отправку куков
      }
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      {
        message:
          error.response?.data?.message || "Ошибка при создании нового списка",
      },
      { status: error.response?.status || 500 }
    );
  }
}
