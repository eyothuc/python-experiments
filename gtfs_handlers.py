from google.transit import gtfs_realtime_pb2
from zipfile import ZipFile
from io import BytesIO
from time import strftime, localtime

import requests
import csv
import os.path

FEED_DIR = './gtfs_csv'
GTFS_URL = 'https://transport.orgp.spb.ru/Portal/transport/internalapi/gtfs'


def isfloat(string):
    try:
        float(string)
        return True
    except ValueError:
        return False


def download_feed():
    if (not os.path.exists(FEED_DIR)):
        os.makedirs(FEED_DIR)

    feed_url = f'{GTFS_URL}/feed.zip'
    response = requests.get(feed_url, verify=False)
    if response.status_code == 200:
        with ZipFile(BytesIO(response.content)) as zip_file:
            zip_file.extractall(path='./gtfs_csv')


# Probably will be replaced with queries to DataBase, when it will be created.
def parse_feed(file_name, ignore_prefix, collect_data):
    response = []
    with open(f'{FEED_DIR}/{file_name}', newline='') as csvfile:
        reader = csv.reader(csvfile, delimiter=',', quotechar='"')

        headers = dict(
            (ind, elem.lstrip(ignore_prefix))
            for ind, elem in enumerate(next(reader))
            if elem in collect_data)

        for row in reader:
            response.append(dict())
            for ind, data in enumerate(row):
                if not (ind in headers):
                    continue
                if data.isdigit():
                    data = int(data)
                elif isfloat(data):
                    data = float(data)
                response[-1][headers[ind]] = data

    return response


def get_stop_forecast_realtime_info(stop_id):
    feed = gtfs_realtime_pb2.FeedMessage()
    stop_url = f'{GTFS_URL}/realtime/stopforecast?stopID={stop_id}'
    response = requests.get(stop_url, verify=False, timeout=10000)
    feed.ParseFromString(response.content)

    stop_info = []
    for entity in feed.entity:
        stop_info.append(dict())
        trip_update = entity.trip_update
        if trip_update.trip.route_id:
            stop_info[-1]['route_id'] = int(entity.trip_update.trip.route_id)
        if trip_update.vehicle.id:
            stop_info[-1]['vehicle_id'] = int(entity.trip_update.vehicle.id)
        stop_time_update = trip_update.stop_time_update[0]
        if stop_time_update.arrival.time:
            time = int(stop_time_update.arrival.time)
            stop_info[-1]['arrival'] = \
                strftime('%Y-%m-%dT%H:%M:%S+03:00', localtime(time))

    return stop_info


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
        if trip_update.stop_time_update:
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
        if entity.vehicle:
            vehicle = entity.vehicle
            vehicle_position[-1]['route_id'] = int(vehicle.trip.route_id)
            position = vehicle.position
            vehicle_position[-1]['lat'] = float(position.latitude)
            vehicle_position[-1]['lon'] = float(position.longitude)
            vehicle_position[-1]['bearing'] = int(position.bearing)

    return vehicle_position


if (__name__ == '__main__'):
    pass
