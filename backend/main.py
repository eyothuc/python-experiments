from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, current_user
# from flask_login import login_required
from functools import wraps

from werkzeug.security import generate_password_hash, check_password_hash

import database
import gtfs_handlers
import tables


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print(request.cookies)
        print(request.headers)
        print(session)
        if not current_user.is_authenticated:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


app = Flask(__name__)
CORS(app, supports_credentials=True)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SECRET_KEY'] = 'your_key'
app.config['SESSION_PERMANENT'] = True

app.config["SESSION_COOKIE_SAMESITE"] = "None"
app.config["SESSION_COOKIE_SECURE"] = True

login_manager = LoginManager(app)
# login_manager.login_view = 'login'
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
        return jsonify({"message":
                        "Пользователь c таким логином уже существует"}), 401
    if not username or not password:
        return jsonify({"message":
                        "Поля username и password должны быть заполнены"}), 401
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
        print(session)
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
    # return jsonify([{"route_id": "Hello, Makushimu"}])
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


# @app.route('/api/create', methods=['GET'])
# def create_db():
#     database.create_db()
#     return jsonify("Creating")


@app.route('/api/update', methods=['GET'])
def update_db():
    database.update_db()
    return jsonify("Updating")


@app.route('/api/lists/<list_id>/add', methods=['POST'])
@login_required
def add_stop_to_list(list_id):
    data = request.json
    stop = int(data.get('stopId', 0))
    if not stop:
        return jsonify('Stop id is required')
    res = database.add_stops_to_list(current_user.user_id,
                                     int(list_id), stop)
    if not res:
        return 'forbidden', 403
    return jsonify(res.to_dict()), 200


@app.route('/api/lists/<list_id>/remove', methods=['POST'])
@login_required
def remove_stop_from_list(list_id):
    data = request.json
    stop = int(data.get('stopId', 0))
    if not stop:
        return jsonify('Stop id is required')
    res = database.remove_stops_from_list(current_user.user_id,
                                          int(list_id), stop)
    if res:
        return jsonify('Forbidden'), 403
    return jsonify("Success"), 200


@app.route('/api/lists/<list_id>', methods=['GET'])
@login_required
def get_list_by_id(list_id):
    return jsonify(database.get_list_by_id(int(list_id)).to_dict())


@app.route('/api/lists', methods=['POST'])
@login_required
def add_list():
    data = request.json
    stops = list(map(int, data.get('stops', [])))
    name = data.get('name', None)
    if not name:
        return jsonify({"message": "List name (name) is required"}), 400
    new_list = database.add_list(name, stops, current_user.user_id)

    return jsonify(new_list.to_dict()), 200


@app.route('/api/lists', methods=['GET'])
@login_required
def get_lists():
    user_lists = database.get_lists_by_user_id(current_user.user_id)
    lists = gtfs_handlers.get_stopforecast_for_lists(user_lists)
    return jsonify(lists), 200


@app.route('/api/lists/<list_id>', methods=['DELETE'])
@login_required
def delete_list(list_id):
    res = database.delete_list(int(list_id), current_user.user_id)
    if res:
        return jsonify({"message": res})
    return jsonify({"message": "Success"}), 200


if __name__ == '__main__':
    database.create_db()
    app.run(debug=True, port=8000, host='0.0.0.0')
