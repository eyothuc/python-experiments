# import requests
from flask import Flask, jsonify, request
import gtfs_handlers

app = Flask(__name__)


@app.route('/api/stops', methods=['GET'])
def get_stops():
    stops = gtfs_handlers.parse_feed(
        file_name='stops.txt',
        ignore_prefix='stop_',
        collect_data=['stop_id', 'stop_name', 'stop_lat',
                      'stop_lon'])
    return jsonify(stops[:40])


@app.route('/api/stops/<id>', methods=['GET'])
def get_stop_info(id):
    stop_info = gtfs_handlers.get_stop_realtime_info(id)
    return jsonify(stop_info)


@app.route('/api/vehicletrips/<vehicle_ids>', methods=['GET'])
def get_vehicle_info(vehicli_ids):
    vehicle_info = gtfs_handlers.get_vehicle_realtime_info(vehicli_ids)
    gtfs_handlers.get_position_realtime_info()
    return jsonify(vehicle_info)


@app.route('/api/vehicles')
def get_vehicle_info2():
    bbox = request.args.get('bbox', None)
    transports = request.args.get('transports', None)
    routeIDs = request.args.get('routeIDs', None)

    vehicles = \
        gtfs_handlers.get_vehicle_position_realtime_info(
            bbox, transports, routeIDs)

    return jsonify(vehicles)


if (__name__ == '__main__'):
    app.run(debug=True)
