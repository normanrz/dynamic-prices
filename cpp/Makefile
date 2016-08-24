PYTHON_HOME=/usr/local/Cellar/python3/3.5.1/Frameworks/Python.framework/Versions/3.5

optimize_price.so: optimize_price.cpp PriceOptimizer.cpp
	$(CXX) -shared --std=c++14 \
		optimize_price.cpp \
		-I$(PYTHON_HOME)/include/python3.5m \
		-L$(PYTHON_HOME)/lib \
		-I/usr/local/include \
		-L/usr/local/lib \
		-lpython3.5m \
		-lboost_python3 \
		-fpic \
		-o optimize_price.so
