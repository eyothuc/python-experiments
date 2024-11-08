import tables
import gtfs_handlers
from sqlalchemy import create_engine
from sqlalchemy.orm import Session



ENGINE = \
    create_engine('postgresql://postgres:q1w2@localhost:5432',
                  echo=True)


def create_db():
    tables.Base.metadata.create_all(ENGINE)


def update_db():
    stops = gtfs_handlers.parse_csv_file(
        file_name='stops.txt',
        ignore_prefix='stop_',
        collect_data='all')

    routes = gtfs_handlers.parse_csv_file(
        file_name='routes.txt',
        ignore_prefix='route_',
        collect_data='all'
    )

    with Session(ENGINE) as session:
        session.query(tables.Stop).delete()
        session.query(tables.Route).delete()
        session.commit()

        for stop in stops:
            instance = tables.Stop(
                stop_id=stop["id"],
                stop_code=stop["code"],
                stop_name=stop["name"],
                stop_lat=stop["lat"],
                stop_lon=stop["lon"],
                location_type=stop["location_type"],
                wheelchair_boarding=stop["wheelchair_boarding"],
                transport_type=stop["transport_type"]
            )
            session.add(instance)

        for route in routes:
            instance = tables.Route(
                route_id=route["id"],
                agency_id=route["agency_id"],
                route_short_name=route["short_name"],
                route_long_name=route["long_name"],
                route_type=route["type"],
                transport_type=route["transport_type"],
                circular=route["circular"],
                urban=route["urban"],
                night=route["night"]

            )
            session.add(instance)
        session.commit()


def query_db(db_class):
    with Session(ENGINE) as session:
        data = session.query(db_class).all()
        return data
