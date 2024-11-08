# from sqlalchemy.orm import relationship
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import DeclarativeBase
# from sqlalchemy import ForeignKey
from sqlalchemy import String


class Base(DeclarativeBase):
    def to_dict(self, collect, ignore_prefix):
        result = {}
        for column in self.__table__.columns:
            if column.name not in collect:
                continue
            value = getattr(self, column.name)
            result[column.name.removeprefix(ignore_prefix)] = value
        return result

    pass


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
