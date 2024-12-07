import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL; // Замените на ваш URL backend

// Регистрация пользователя
export const registerUser = async (username: string, password: string) => {
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
      withCredentials: true
    },
    
  );

  if (response.status !== 200) {
    throw new Error(response.data.message || "Ошибка регистрации");
  }
  return response.data.message;
};

// Вход пользователя
export const loginUser = async (
  username: string,
  password: string,
  isRemember: boolean
) => {
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
      withCredentials: true
    }
  );

  if (response.status !== 200) {
    throw new Error(response.data.message || "Ошибка входа");
  }
  return response;
};
