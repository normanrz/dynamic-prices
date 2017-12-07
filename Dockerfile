FROM ubuntu:14.04

COPY . /app

WORKDIR /app

RUN apt-get update && \
  apt-get install -y git-core curl build-essential python3 python3-pip python3-numpy python3-scipy python3-dev libboost-python1.55.0 libboost-python1.55-dev && \
  pip3 install sklearn flask && \
  curl -sL https://deb.nodesource.com/setup_6.x | bash - && \
  apt-get install -y nodejs && \
  npm i -g bower && \
  cd html && bower --allow-root install && cd .. && \
  cd cpp && make -f Makefile.ubuntu && cd .. && \
  rm -rf /var/lib/apt/lists/*

CMD ["python3", "server.py"]
