# OnlyMaps

## Описание

`OnlyMaps` — это веб-приложение, содержащее фронтенд на Next.js и бэкенд на Flask, развернутые с использованием Docker и Nginx. 

Приложение автоматически настраивается и разворачивается с помощью Docker Compose, предоставляя доступ через HTTP.

## Требования

Для развертывания приложения необходимо установить:

1. **Git** — для клонирования репозитория.
2. **Docker** и **Docker Compose** — для управления контейнерами.

### Установка зависимостей (на примере Ubuntu):

```bash
# Обновление пакетов
sudo apt update

# Установка Git
sudo apt install git -y

# Установка Docker
sudo apt install docker.io -y

# Установка Docker Compose
sudo apt install docker-compose -y
```

## Развертывание приложения

Для развертывания приложения необходимо:

1. Склонировать репозиторий
```
git clone https://github.com/eyothuc/python-experiments.git
```
2. Находясь в директории с проектом, выполнить команду:
```
docker compose -f docker-compose-prod.yaml up --build -d
```
3. Дождаться развертывание контейнеров

Приложение будет доступно по адресу:
```
http://<SERVER_IP>
```
где <SERVER_IP> - IP-адрес вашего сервера (или localhost при развертывании локально)
