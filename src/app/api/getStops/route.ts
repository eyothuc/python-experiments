// app/api/getStops/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

// Обработчик GET-запросов
export async function GET() {
  try {
    // Делаем запрос на внешнее API
    const response = await axios.get("https://trashapigtfs.loca.lt/api/stops");

    // Возвращаем полученные данные как JSON
    return NextResponse.json(response.data);
  } catch {
    // Обрабатываем ошибки и возвращаем ошибочный статус
    return NextResponse.json(
      { message: "Ошибка при получении данных" },
      { status: 500 }
    );
  }
}
