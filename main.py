from flask import Flask, jsonify, request
import gtfs_handlers
import database
import tables

app = Flask(__name__)


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


if (__name__ == '__main__'):
    app.run(debug=True)
