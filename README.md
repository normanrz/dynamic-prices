# Dynamic pricing for selling perishable goods

This system provides a configurable demand estimation model, a calculation for optimal price strategies and a simulation runner.
All functionality is available and configurable in a web-based dashboard.

## Install
### Dependencies
* Python 3.5.1
* Boost 1.60.0
* Boost.Python 1.60.0
* C++14 compiler
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

## Run
```
python3 server.py
```

The dashboard will be available at http://localhost:5000/
