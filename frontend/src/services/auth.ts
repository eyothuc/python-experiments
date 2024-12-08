import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL; // Замените на ваш URL backend

export const registerUser = async (username: string, password: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/auth/register`,
      {
        username,
        password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    console.log("Ответ от сервера:", response);

    // Успешный статус может быть 200 (OK) или 201 (CREATED)
    if (response.status === 200 || response.status === 201) {
      return response.data.message; // Успешное сообщение от сервера
    } else {
      throw new Error(response.data.message || "Ошибка регистрации.");
    }
  } catch (error: any) {
    console.error("Ошибка в запросе регистрации:", error);
    throw new Error(error.response?.data?.message || "Ошибка подключения к серверу.");
  }
};



export const loginUser = async (
  username: string,
  password: string,
  isRemember: boolean
) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/auth/login`,
      {
        username,
        password,
        is_remember: isRemember,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    console.log("Ответ от сервера при входе:", response);

    // Успешный статус может быть 200 (OK) или 201 (CREATED)
    if (response.status === 200 || response.status === 201) {
      return response.data; // Возвращаем данные о пользователе
    } else {
      throw new Error(response.data.message || "Ошибка входа.");
    }
  } catch (error: any) {
    console.error("Ошибка в запросе входа:", error);
    throw new Error(error.response?.data?.message || "Ошибка подключения к серверу.");
  }
};