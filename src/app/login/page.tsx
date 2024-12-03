"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/auth";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRemember, setIsRemember] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await loginUser(username, password, isRemember);

    // Сохраняем пользователя и куки
    localStorage.setItem("currentUser", username);

    const cookies = response.headers;

    if (cookies) {
      cookies.forEach((cookie: any) => {
        document.cookie = cookie;
      });
    }

    setMessage("Успешный вход");
    router.push("/"); // Переход на страницу с картой
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded shadow-md max-w-sm w-full"
      >
        <h2 className="text-xl font-bold mb-4">Вход</h2>
        <input
          type="text"
          placeholder="Имя пользователя"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={isRemember}
            onChange={(e) => setIsRemember(e.target.checked)}
            className="mr-2"
          />
          <label>Запомнить меня</label>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Войти
        </button>
        {message && <p className="text-center text-red-500 mt-4">{message}</p>}
      </form>
    </div>
  );
};

export default LoginPage;
