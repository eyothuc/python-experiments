import pandas
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

import gtfs_handlers
import tables
from gtfs_handlers import download_feed

ENGINE = create_engine('postgresql://postgres:q1w2@maps-postgres:5432', echo=True)


def create_db():
    tables.Base.metadata.create_all(ENGINE)


def update_db():
    download_feed()
    file_name = f'{gtfs_handlers.FEED_DIR}/stops.txt'
    dataframe = pandas.read_csv(file_name).set_index('stop_id')
    dataframe.to_sql(con=ENGINE, name=tables.Stop.__tablename__,
                     if_exists='replace')
    file_name = f'{gtfs_handlers.FEED_DIR}/routes.txt'
    dataframe = pandas.read_csv(file_name).set_index('route_id')
    dataframe.to_sql(con=ENGINE, name=tables.Route.__tablename__,
                     if_exists='replace')


def query_db(db_class):
    with Session(ENGINE) as session:
        data = session.query(db_class).all()
        return data


def get_user_by_username(username):
    with Session(ENGINE) as session:
        return session.query(tables.User).filter_by(username=username).first()


def get_user_by_id(user_id):
    with Session(ENGINE) as session:
        return session.query(tables.User).get(user_id)


def create_user(username, password):
    with Session(ENGINE) as session:
        user = tables.User(username=username, password=password)
        session.add(user)
        session.commit()
