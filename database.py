import tables
import gtfs_handlers
import pandas
from sqlalchemy import create_engine
from sqlalchemy.orm import Session


ENGINE = \
    create_engine('postgresql://postgres:q1w2@localhost:5432',
                  echo=True)


def create_db():
    tables.Base.metadata.create_all(ENGINE)


def update_db():
    file_name = f'{gtfs_handlers.FEED_DIR}/stops.txt'
    dataframe = pandas.read_csv(file_name).set_index('stop_id')
    dataframe.to_sql(con=ENGINE, name=tables.Stop.__tablename__,
                     if_exists='replace')

    file_name = f'{gtfs_handlers.FEED_DIR}/routes.txt'
    dataframe = pandas.read_csv(file_name).set_index('route_id')
    dataframe.to_sql(con=ENGINE, name=tables.Stop.__tablename__,
                     if_exists='replace')


def query_db(db_class):
    with Session(ENGINE) as session:
        data = session.query(db_class).all()
        return data
