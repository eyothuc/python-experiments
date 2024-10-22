# import requests
from flask import Flask, jsonify
import gtfs_handlers


app = Flask(__name__)


@app.route('/api/stop-<id>', methods=['GET'])
def get_stop_info(id):
    vehicles = gtfs_handlers.get_stop_vehicles(id)
    return vehicles


@app.route('/api/stops', methods=['GET'])
def get_stops():
    stops = gtfs_handlers.parse_feed(
        f"./{gtfs_handlers.FEED_DIR}/stops.txt",
        "stop_id", "stop_name", "stop_lat",
        "stop_lon", "transport_type")
    return jsonify(stops)


if (__name__ == '__main__'):
    app.run(debug=True)
