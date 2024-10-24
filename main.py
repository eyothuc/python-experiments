# import requests
from flask import Flask, jsonify
import gtfs_handlers

app = Flask(__name__)


@app.route('/api/stops', methods=['GET'])
def get_stops():
    stops = gtfs_handlers.parse_feed(
        file_name='stops.txt',
        ignore_prefix='stop_',
        collect_data=['stop_id', 'stop_name', 'stop_lat',
                      'stop_lon'])
    return jsonify(stops[:10])


@app.route('/api/stops/<id>', methods=['GET'])
def get_stop_info(id):
    stop_info = gtfs_handlers.get_stop_realtime_info(id)
    return jsonify(stop_info)


@app.route('/api/vehicles/<ids>', methods=['GET'])
def get_vehicle_info(ids):
    vehicle_info = gtfs_handlers.get_vehicle_realtime_info(ids)
    gtfs_handlers.get_position_realtime_info()
    return jsonify(vehicle_info)


if (__name__ == '__main__'):
    app.run(debug=True)
