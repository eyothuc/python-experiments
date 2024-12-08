"use client";

import React, { useState } from "react";
import { registerUser } from "@/services/auth";
import { useRouter } from "next/navigation";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const message = await registerUser(username, password);
      console.log("Успешная регистрация:", message);
      setMessage(message); // Показываем сообщение об успехе
      router.push("/login"); // Перенаправляем на страницу логина
    } catch (error: any) {
      console.error("Ошибка регистрации:", error);
      setMessage(error.message); // Показываем сообщение об ошибке
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-green-500 to-teal-600 text-white">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full text-gray-800"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Регистрация</h2>
        <input
          type="text"
          placeholder="Имя пользователя"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition"
        >
          Зарегистрироваться
        </button>
        {message && (
          <p className="text-center text-red-500 mt-4 text-sm">{message}</p>
        )}
        <p className="text-center text-sm mt-6">
          Уже есть аккаунт?{" "}
          <a
            href="/login"
            className="text-green-500 hover:underline hover:text-green-700"
          >
            Войдите
          </a>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
