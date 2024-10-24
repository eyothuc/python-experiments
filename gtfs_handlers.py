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


def get_stop_realtime_info(stop_id):
    feed = gtfs_realtime_pb2.FeedMessage()
    stop_url = f'{GTFS_URL}/realtime/stopforecast?stopID={stop_id}'
    response = requests.get(stop_url, verify=False, timeout=10000)
    feed.ParseFromString(response.content)
    stop_info = []
    print(feed)
    for entity in feed.entity:
        if entity.trip_update.vehicle.id:
            stop_info.append(dict())
            stop_info[-1]["id"] = int(entity.trip_update.vehicle.id)
        if entity.trip_update.stop_time_update[0].arrival.time:
            time = int(entity.trip_update.stop_time_update[0].arrival.time)
            stop_info[-1]['arrival_string'] = \
                strftime('%Y-%m-%dT%H:%M:%S+03:00', localtime(time))
            stop_info[-1]['arrival_epoch'] = int(time)
    return stop_info


def get_vehicle_realtime_info(vehicle_ids):
    feed = gtfs_realtime_pb2.FeedMessage()
    stop_url = f'{GTFS_URL}/realtime/vehicletrips?vehicleIDs={vehicle_ids}'
    # f'realtime/vehicletrips?vehicleIDs=22752,23068'
    response = requests.get(stop_url, verify=False, timeout=10000)
    feed.ParseFromString(response.content)
    vehicle_info = dict()
    for entity in feed.entity:
        id = entity.id
        vehicle_info[id] = list()
        if entity.trip_update.stop_time_update:
            for row in entity.trip_update.stop_time_update:
                vehicle_info[id].append(dict())
                vehicle_info[id][-1]['stop_id'] = int(row.stop_id)
                time = row.arrival.time
                vehicle_info[id][-1]['arirval_string'] = \
                    strftime('%Y-%m-%dT%H:%M:%S+03:00', localtime(time))
                vehicle_info[id][-1]['arrival_epoch'] = int(time)
    return vehicle_info


# WIP
# https://transport.orgp.spb.ru/Portal/transport/internalapi/gtfs/realtime/vehicle?bbox=30.32,59.84,30.33,59.85&transports=bus,trolley,tram,ship&routeIDs=1329
# 59.950731,30.232945
def get_position_realtime_info(bbox='59.94,30.22,59.97,30.25',
                               transports='bus',
                               routeIDs='2132'):
    feed = gtfs_realtime_pb2.FeedMessage()
    stop_url = f'{GTFS_URL}/realtime/vehicle?' \
        f'bbox={bbox}&transports={transports}'  # &routeIDs={routeIDs}'
    # f'routeIDs={routeIDs}'
    response = requests.get(stop_url, verify=False, timeout=10000)
    feed.ParseFromString(response.content)
    print(feed)


if (__name__ == '__main__'):
    pass
