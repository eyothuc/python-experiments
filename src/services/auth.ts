const API_URL = "/api"; // Замените на ваш URL backend

// Регистрация пользователя
export const registerUser = async (username: string, password: string) => {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Ошибка регистрации");
  }
  return data.message;
};

// Вход пользователя
export const loginUser = async (
  username: string,
  password: string,
  isRemember: boolean
) => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password, is_remember: isRemember }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Ошибка входа");
  }
  return data.message;
};
