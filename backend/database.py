from sqlalchemy import text
import pandas as pd
import pandas
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

import gtfs_handlers
import tables
from gtfs_handlers import download_feed

ENGINE = create_engine('postgresql://postgres:q1w2@maps-postgres:5432', echo=True)


def create_db():
    tables.Base.metadata.create_all(ENGINE)


def load_csv_to_tmp_table(file_path, table_name, index_col):
    dataframe = pd.read_csv(file_path).set_index(index_col)
    dataframe.to_sql(con=ENGINE, name=table_name, if_exists='replace')


def gen_update_sql(target_table, temp_table, columns, key_column):
    set_clause = ", ".join([f"{col} = temp.{col}" for col in columns])
    return text(f"""
    UPDATE {target_table} AS fin
    SET {set_clause}
    FROM {temp_table} AS temp
    WHERE fin.{key_column} = temp.{key_column}
    """)


def gen_insert_sql(target_table, temp_table, columns, key_column):
    columns_str = ", ".join(columns)
    values_str = ", ".join([f"temp.{col}" for col in columns])
    return text(f"""
    INSERT INTO {target_table} ({key_column}, {columns_str})
    SELECT temp.{key_column}, {values_str}
    FROM {temp_table} AS temp
    WHERE NOT EXISTS (
        SELECT 1
        FROM {target_table} AS fin
        WHERE fin.{key_column} = temp.{key_column}
    )
    """)


def gen_delete_sql(target_table, temp_table, key_column):
    return text(f"""
    DELETE FROM {target_table} AS fin
    WHERE NOT EXISTS (
        SELECT 1
        FROM {temp_table} AS temp
        WHERE fin.{key_column} = temp.{key_column}
    )
    """)


def execute_sql(sql):
    try:
        with Session(ENGINE) as session:
            session.execute(sql)
            session.commit()
            print("Operation successful")
    except Exception as e:
        print(f"Error executing SQL: {e}")
        session.rollback()
        raise


def update_db():
    download_feed()

    # Stops
    file_name = f'{gtfs_handlers.FEED_DIR}/stops.txt'
    load_csv_to_tmp_table(file_name, 'temp_stops_table', 'stop_id')

    stops_columns = [
        'stop_code',
        'stop_name',
        'stop_lat',
        'stop_lon',
        'location_type',
        'wheelchair_boarding',
        'transport_type',
    ]
    update_stops_sql = gen_update_sql(
        'stops', 'temp_stops_table', stops_columns, 'stop_id')
    execute_sql(update_stops_sql)
    insert_stops_sql = gen_insert_sql(
        'stops', 'temp_stops_table', stops_columns, 'stop_id')
    print(insert_stops_sql)
    execute_sql(insert_stops_sql)
    delete_stops_sql = gen_delete_sql(
        'stops', 'temp_stops_table', 'stop_id')
    execute_sql(delete_stops_sql)

    # Routes
    file_name = f'{gtfs_handlers.FEED_DIR}/routes.txt'
    load_csv_to_tmp_table(file_name, 'temp_routes_table', 'route_id')

    routes_columns = [
        "agency_id",
        "route_short_name",
        "route_long_name",
        "route_type",
        "transport_type",
        "circular",
        "urban",
        "night",
    ]
    update_routes_sql = gen_update_sql(
        'routes', 'temp_routes_table', routes_columns, 'route_id')
    execute_sql(update_routes_sql)
    insert_routes_sql = gen_insert_sql(
        'routes', 'temp_routes_table', routes_columns, 'route_id')
    execute_sql(insert_routes_sql)
    delete_routes_sql = gen_delete_sql(
        'routes', 'temp_routes_table', 'route_id')
    execute_sql(delete_routes_sql)


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


def add_list(name, stops_ids, user_id):
    with Session(ENGINE) as session:
        stops = session.query(tables.Stop).filter(
            tables.Stop.stop_id.in_(stops_ids)).all()
        new_list = tables.StopList(user_id=user_id,
                                   name=name,
                                   stops=stops)
        session.add(new_list)
        session.commit()
        return "Success"


def add_stops_to_list(username, list_id, stop_id):
    stops_list = get_list_by_id(list_id)
    user_id = get_user_by_username(username).user_id
    if stops_list.user_id != user_id:
        # return "Trying to access different user's list"
        return {"message": "Forbidden"}

    with Session(ENGINE) as session:
        new_stop = session.query(tables.Stop).filter(
            tables.Stop.stop_id == stop_id).first()
        if new_stop in stops_list.stops:
            return stops_list.to_dict()
        stops_list.stops.append(new_stop)
        session.add(stops_list)
        session.commit()
        return stops_list.to_dict()


def remove_stops_from_list(username, list_id, stop_id):
    stops_list = get_list_by_id(list_id)
    user_id = get_user_by_username(username).user_id
    if stops_list.user_id != user_id:
        return "Trying to access different user's list"

    with Session(ENGINE) as session:
        session.query("stop_to_list_table").\
            filter(tables.stop_to_list_table.stoplists == list_id,
                   tables.stop_to_list_table.stops == stop_id).delete()
        session.commit()


def update_stops_to_list(user_id, list_id, stops_ids):
    stops_list = get_list_by_id(list_id)
    if stops_list.user_id != user_id:
        return "Trying to access different user's list"

    with Session(ENGINE) as session:
        new_stops = session.query(tables.Stop).filter(
            tables.Stop.stop_id.in_(stops_ids)).all()
        stops_list.stops = new_stops
        session.add(stops_list)
        session.commit()


def get_list_by_id(list_id):
    with Session(ENGINE) as session:
        return session.query(tables.StopList).get(list_id)


def get_lists_by_user_id(user_id):
    with Session(ENGINE) as session:
        return session.query(tables.StopList).\
            filter(tables.StopList.user_id == user_id)


def delete_stops_from_list(user_id, list_id, stops):
    stops_list = get_list_by_id(list_id)
    if stops_list.user_id != user_id:
        return "Trying to access different user's list"


def get_route_names_by_id(route_id):
    with Session(ENGINE) as session:
        route = session.query(tables.Route).get(route_id)
        return (route.route_short_name, route.route_long_name)
