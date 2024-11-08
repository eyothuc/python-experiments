from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user
from werkzeug.security import generate_password_hash, check_password_hash

import database
import gtfs_handlers
import tables

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SECRET_KEY'] = 'your_key'
app.config['SESSION_PERMANENT'] = False

login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    return database.get_user_by_id(user_id)


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if database.get_user_by_username(username):
        return jsonify({"message": "Пользователь c таким логином уже существует"}), 401
    if not username or not password:
        return jsonify({"message": "Поля username и password должны быть заполнены"}), 401
    password_hash = generate_password_hash(password)
    database.create_user(username, password_hash)
    return jsonify({"message": "Регистрация прошла успешно"}), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    is_remember = data.get('is_remember', False)

    if user := database.get_user_by_username(username):
        if not check_password_hash(user.password, password):
            return jsonify({"message": "Неверные данные"}), 401
        login_user(user, remember=is_remember)
        return jsonify({"message": "Успешный вход"}), 200
    return jsonify({"message": "Пользователь не найден"}), 401


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    logout_user()
    return jsonify({'message': 'Выход успешен'}), 200


@app.route('/api/stops', methods=['GET'])
def getStops():
    collect = ['stop_id', 'stop_name', 'stop_lat',
               'stop_lon', 'transport_type']
    stops = [row.to_dict(collect, 'stop_')
             for row
             in database.query_db(tables.Stop)]
    return jsonify(stops)


@app.route('/api/routes', methods=['GET'])
def getRoutes():
    collect = ['route_id', 'route_short_name', 'route_long_name',
               'transport_type']
    routes = [row.to_dict(collect, 'route_')
              for row
              in database.query_db(tables.Route)]
    return jsonify(routes)


@app.route('/api/stops/<stop_id>', methods=['GET'])
def getStopInfo(stop_id):
    stop_info = gtfs_handlers.get_stop_forecast_realtime_info(stop_id)
    return jsonify(stop_info)


@app.route('/api/vehicle/<vehicle_ids>', methods=['GET'])
def getVehicletripsInfo(vehicle_ids):
    vehicle_info = gtfs_handlers.get_vehicle_realtime_info(vehicle_ids)
    gtfs_handlers.get_position_realtime_info()
    return jsonify(vehicle_info)


@app.route('/api/position', methods=['GET'])
def getVehiclePositionInfo():
    bbox = request.args.get('bbox', None)
    transports = request.args.get('transports', None)
    routeIDs = request.args.get('routeIDs', None)

    vehiclePosition = \
        gtfs_handlers.get_vehicle_position_realtime_info(
            bbox, transports, routeIDs)

    return jsonify(vehiclePosition)


@app.route('/api/create', methods=['GET'])
def create_db():
    database.create_db()
    return jsonify("Creating")


@app.route('/api/update', methods=['GET'])
def update_db():
    database.update_db()
    return jsonify("Updating")


if __name__ == '__main__':
    app.run(debug=True)
