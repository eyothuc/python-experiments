FROM python:3.11

RUN apt-get -y update
COPY ./backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ./backend site
WORKDIR /site

EXPOSE 8000

ENTRYPOINT ["python"]
CMD ["./main.py"]
