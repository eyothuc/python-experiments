FROM python:3.11

RUN apt-get -y update
COPY ./requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ./ site
WORKDIR /site

EXPOSE 8000

ENTRYPOINT ["sh", "-c", "python main.py & gunicorn -w 1 -b 0.0.0.0:8000 --log-level debug main:app"]
