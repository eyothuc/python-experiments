"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/auth";
import Cookies from "js-cookie";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRemember, setIsRemember] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await loginUser(username, password, isRemember);
      localStorage.setItem("currentUser", username);
      setMessage("Успешный вход");
      router.push("/"); // Переход на главную страницу
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full text-gray-800"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Вход</h2>
        <input
          type="text"
          placeholder="Имя пользователя"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex items-center mb-6">
          <input
            type="checkbox"
            checked={isRemember}
            onChange={(e) => setIsRemember(e.target.checked)}
            className="mr-2"
          />
          <label className="text-sm">Запомнить меня</label>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition"
        >
          Войти
        </button>
        {message && (
          <p className="text-center text-red-500 mt-4 text-sm">{message}</p>
        )}
        <p className="text-center text-sm mt-6">
          Нет аккаунта?{" "}
          <a
            href="/register"
            className="text-blue-500 hover:underline hover:text-blue-700"
          >
            Зарегистрируйтесь
          </a>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
