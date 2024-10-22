from google.transit import gtfs_realtime_pb2
import requests
from zipfile import ZipFile
from io import BytesIO
import csv
import os.path

FEED_DIR = './gtfs_csv'


def download_feed():
    if (not os.path.exists(FEED_DIR)):
        os.makedirs(FEED_DIR)
    feed_url = 'https://transport.orgp.spb.ru/' \
        'Portal/transport/internalapi/gtfs/feed.zip'
    response = requests.get(feed_url, verify=False)
    if response.status_code == 200:
        with ZipFile(BytesIO(response.content)) as zip_file:
            zip_file.extractall(path="./gtfs_csv")


def parse_feed(file_name, *keys):
    with open(file_name, newline='') as csvfile:
        reader = csv.reader(csvfile, delimiter=',', quotechar='"')
        index = 0
        columns = []
        response = []
        for ind, row in enumerate(reader):
            if (ind == 0):
                for col, name in enumerate(row):
                    if (index >= len(keys)):
                        break
                    if (name == keys[index]):
                        index += 1
                        columns.append(col)
                continue
            response.append([])
            for i, elem in enumerate(row):
                if (i in columns):
                    response[ind-1].append(elem)
        return response


def get_stop_vehicles(id):
    feed = gtfs_realtime_pb2.FeedMessage()
    stop_url = 'https://transport.orgp.spb.ru/' \
        'Portal/transport/internalapi/gtfs/' \
        f'realtime/stopforecast?stopID={id}'
    response = requests.get(stop_url, verify=False, timeout=10000)
    feed.ParseFromString(response.content)
    vehicle_ids = []
    for entity in feed.entity:
        if entity.trip_update.vehicle.id:
            vehicle_ids.append(entity.trip_update.vehicle.id)
    return vehicle_ids


if (__name__ == '__main__'):
    pass
