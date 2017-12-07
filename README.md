# Dynamic pricing for selling perishable goods

This system provides a configurable demand estimation model, a calculation for optimal price strategies and a simulation runner.
All functionality is available and configurable in a web-based dashboard.

## Install with Docker
```
docker build -t dynamic-prices .
docker run -p8083:8083 dynamic-prices
```
The dashboard will be available at http://localhost:8083/

## Install manually
### Dependencies
* Python 3.4 or 3.5
* Boost 1.55.0
* Boost.Python 1.55.0
* C++11 compiler (e.g. GCC4.8)
* node.js + Bower

### Compile C++ module
```
cd cpp
make
```

### Install bower dependencies
```
cd html
bower install
```

### Install on Ubuntu 14.04
```
sudo apt-get install -y python3 python3-pip python3-numpy python3-scipy python3-dev libboost-python1.55.0 libboost-python1.55-dev
sudo pip3 install sklearn flask
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm i -g bower
cd html && bower install && cd ..
cd cpp && make -f Makefile.ubuntu && cd ..
```

## Run
```
python3 server.py
```

The dashboard will be available at http://localhost:8083/
