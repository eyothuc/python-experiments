from flask_login import UserMixin

from typing import Optional, List

from sqlalchemy import Column
from sqlalchemy import Table
from sqlalchemy import String
from sqlalchemy import ForeignKey

from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship


class Base(DeclarativeBase):
    def to_dict(self, collect, ignore_prefix):
        result = {}
        for column in self.__table__.columns:
            if column.name not in collect:
                continue
            value = getattr(self, column.name)
            result[column.name.removeprefix(ignore_prefix)] = value
        return result


stop_to_list_table = Table(
    "stop_to_list_table",
    Base.metadata,
    Column("stops", ForeignKey("stops.stop_id")),
    Column("stoplists", ForeignKey("stoplists.list_id", ondelete="CASCADE")),
)


class Stop(Base):
    __tablename__ = "stops"
    stop_id: Mapped[int] = mapped_column(primary_key=True)
    stop_code: Mapped[int]
    stop_name: Mapped[str] = mapped_column(String(1000))
    stop_lat: Mapped[float]
    stop_lon: Mapped[float]
    location_type: Mapped[int]
    wheelchair_boarding: Mapped[int]
    transport_type: Mapped[str] = mapped_column(String(10))


class Route(Base):
    __tablename__ = "routes"
    route_id: Mapped[int] = mapped_column(primary_key=True)
    agency_id: Mapped[str] = mapped_column(String(1000))
    route_short_name: Mapped[str] = mapped_column(String(20))
    route_long_name: Mapped[str] = mapped_column(String(1000))
    route_type: Mapped[int]
    transport_type: Mapped[str] = mapped_column(String(10))
    circular: Mapped[int]
    urban: Mapped[int]
    night: Mapped[int]


class User(Base, UserMixin):
    __tablename__ = "users"
    user_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[Optional[str]] = mapped_column(String(100))
    username: Mapped[str] = mapped_column(String(100))
    password: Mapped[str] = mapped_column(String(500))
    fav_stop_list: Mapped[List["StopList"]] = relationship(
        cascade="all", lazy='subquery')

    def get_id(self):
        return str(self.user_id)

    def get_lists_dict(self, collect_stop=["stop_id", "stop_name", "stop_lat",
                                           "stop_lon", "transport_type"]):
        result = []
        for list in self.fav_stop_list:
            result.append(list.to_dict(collect_stop))
        return result


class StopList(Base):
    __tablename__ = "stoplists"
    list_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"))
    name: Mapped[str] = mapped_column(String(100), unique=True)
    stops: Mapped[List["Stop"]] = relationship(secondary=stop_to_list_table,
                                               lazy='subquery',
                                               cascade='all, delete',
                                               passive_deletes=True)

    def to_dict(self, collect_stop=["stop_id", "stop_name", "stop_lat",
                                    "stop_lon", "transport_type"],
                ignore_stops=False):
        result = {}
        result["id"] = self.list_id
        result["name"] = self.name
        if not collect_stop:
            return result
        if not ignore_stops:
            result["stops"] = []
            for stop in self.stops:
                result["stops"].append(stop.to_dict(collect_stop, "stop_"))
        return result
