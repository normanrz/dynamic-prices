optimize_price.so: optimize_price.cpp PriceOptimizer.cpp
	$(CXX) -shared --std=c++14 \
		-I/usr/local/Cellar/python3/3.5.1/Frameworks/Python.framework/Versions/3.5/include/python3.5m \
		-L/usr/local/Cellar/python3/3.5.1/Frameworks/Python.framework/Versions/3.5/lib \
		-I/usr/local/include \
		-L/usr/local/lib \
		-lpython3.5m \
		-lboost_python3 \
		-fpic \
		optimize_price.cpp -o optimize_price.so

price_optimizer: test.cpp PriceOptimizer.cpp
	$(CXX) --std=c++14 -O3 test.cpp -o price_optimizer
