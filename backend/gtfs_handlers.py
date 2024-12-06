import os.path
from io import BytesIO
from time import strftime, localtime
from zipfile import ZipFile

import requests
from google.transit import gtfs_realtime_pb2

import database
import tables

FEED_DIR = '../gtfs_csv'
GTFS_URL = 'https://transport.orgp.spb.ru/Portal/transport/internalapi/gtfs'


def isfloat(string):
    try:
        float(string)
        return True
    except ValueError:
        return False


def download_feed():
    if not os.path.exists(FEED_DIR):
        os.makedirs(FEED_DIR)

    feed_url = f'{GTFS_URL}/feed.zip'
    response = requests.get(feed_url, verify=False)
    if response.status_code == 200:
        with ZipFile(BytesIO(response.content)) as zip_file:
            zip_file.extractall(path=FEED_DIR)


def get_stop_forecast_realtime_info(stop_id):
    feed = gtfs_realtime_pb2.FeedMessage()
    stop_url = f'{GTFS_URL}/realtime/stopforecast?stopID={stop_id}'
    response = requests.get(stop_url, verify=False, timeout=10000)
    feed.ParseFromString(response.content)

    stop_info = []
    for entity in feed.entity:
        stop_info.append(dict())
        trip_update = entity.trip_update
        route_id = int(trip_update.trip.route_id)
        route_sname, route_lname = database.get_route_names_by_id(route_id)
        stop_info[-1]['route_id'] = route_id
        stop_info[-1]['route_short_name'] = route_sname
        stop_info[-1]['route_long_name'] = route_lname
        stop_info[-1]['vehicle_id'] = int(trip_update.vehicle.id)
        stop_time_update = trip_update.stop_time_update[0]
        time = int(stop_time_update.arrival.time)
        stop_info[-1]['arrival'] = \
            strftime('%Y-%m-%dT%H:%M:%S+03:00', localtime(time))

    return stop_info


def get_stopforecast_for_lists(user_lists: tables.StopList):
    res = []
    for lst in user_lists:
        res.append(dict())
        res[-1]["list_info"] = lst.to_dict(ignore_stops=False)
        res[-1]["stops"] = []
        for stop in lst.stops:
            res[-1]["stops"].append(dict())
            res[-1]["stops"][-1] =\
                get_stop_forecast_realtime_info(stop.stop_id)


def get_vehicle_forecast_realtime_info(vehicle_ids):
    feed = gtfs_realtime_pb2.FeedMessage()
    stop_url = f'{GTFS_URL}/realtime/vehicletrips?vehicleIDs={vehicle_ids}'
    response = requests.get(stop_url, verify=False, timeout=10000)
    feed.ParseFromString(response.content)

    vehicle_info = dict()
    for entity in feed.entity:
        id = entity.id
        vehicle_info[id] = list()
        trip_update = entity.trip_update
        for row in trip_update.stop_time_update:
            vehicle_info[id].append(dict())
            vehicle_info[id][-1]['stop_id'] = int(row.stop_id)
            time = row.arrival.time
            vehicle_info[id][-1]['arrival'] = \
                strftime('%Y-%m-%dT%H:%M:%S+03:00', localtime(time))

    return vehicle_info


def get_vehicle_position_realtime_info(bbox, transports, routeIDs):
    req = []
    if bbox is not None:
        req.append(f'bbox={bbox}')
    if transports is not None:
        req.append(f'transports={transports}')
    if routeIDs is not None:
        req.append(f'routeIDs={routeIDs}')

    feed = gtfs_realtime_pb2.FeedMessage()
    stop_url = f'{GTFS_URL}/realtime/vehicle?{"&".join(req)}'
    response = requests.get(stop_url, verify=False, timeout=10000)
    feed.ParseFromString(response.content)

    vehicle_position = []
    for entity in feed.entity:
        vehicle_position.append(dict())

        vehicle_position[-1]['vehicle_id'] = int(entity.id)
        vehicle = entity.vehicle
        vehicle_position[-1]['route_id'] = int(vehicle.trip.route_id)
        position = vehicle.position
        vehicle_position[-1]['lat'] = float(position.latitude)
        vehicle_position[-1]['lon'] = float(position.longitude)
        vehicle_position[-1]['bearing'] = int(position.bearing)

    return vehicle_position


if (__name__ == '__main__'):
    pass
