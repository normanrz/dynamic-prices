#!/usr/local/bin/python3
from flask import Flask, Response, request, send_from_directory
import json
from os import path
from data import make_model, generate_train_data
from cpp.optimize_price import PriceOptimizer
import numpy as np

static_assets_path = path.join(path.dirname(__file__), "html")
app = Flask(__name__, static_folder=static_assets_path)

def mean(l):
  _l = list(l)
  return sum(_l) / len(_l)

competitor_prices = np.array([11, 13, 14], dtype=np.float64)
def make_price_optimizer(competitor_prices,
    T=20, N=15,
    price_range=np.arange(10, 20, 0.1), 
    L=0.01, delta=0.99, Z=0.5):
  _, sales_model_coef = make_model(*generate_train_data(1000, T, price_range))
  po = PriceOptimizer(T, N)
  po.L = L
  po.Z = Z
  po.delta = delta
  po.price_range = price_range
  po.competitor_prices = competitor_prices
  po.sales_model_coef = sales_model_coef
  return po

def run_simulations(iterations, T, N, L, Z, delta, price_range):

  results = []
  optimizer = make_price_optimizer(competitor_prices, T=T, N=N, Z=Z, L=L, delta=delta, price_range=price_range)

  L = optimizer.L
  Z = optimizer.Z

  price_history = np.zeros((iterations, T))
  profit_history = np.zeros((iterations, T))
  competitor_prices_history = np.zeros((iterations, T, competitor_prices.size))
  inventory_history = np.zeros((iterations, T))
  
  for i in range(iterations):

    profit = 0
    n = N
    
    for t in range(0, T):
      price, V = optimizer.run(t, n)
      pi = optimizer.sales_model(price, t)
      sales = min(n, np.random.poisson(pi))
      n = n - sales
      profit += price * sales - L * n

      price_history[i,t] = price
      inventory_history[i,t] = n
      competitor_prices_history[i,t,:] = competitor_prices
      profit_history[i,t] = profit

      # # Change competitor prices
      # competitor_prices = competitor_prices * np.random.uniform(0.8, 1.2, 5)
      # optimizer = PriceOptimizer(sales_model, competitor_prices, N=n, T=T, L=L, Z=Z)

    # Realize salvage profits
    profit += n * Z

  averages = {
    'price': np.nan_to_num(np.sum(price_history, axis=0) / np.sum(price_history > 0, axis=0)).tolist(),
    'inventory': np.mean(inventory_history, axis=0).tolist(),
    'profit': np.mean(profit_history, axis=0).tolist(),
    'end_probability': (np.sum(inventory_history == 0, axis=0) / iterations).tolist()
  }

  return {
    'all': {
      'price': price_history.tolist(),
      'inventory': inventory_history.tolist(),
      'profit': profit_history.tolist(),
      'competitors': competitor_prices_history.tolist()
    },
    'averages': averages
  }


@app.route('/')
def index():
  return app.send_static_file('index.html')

@app.route('/<path:path>')
def send_static_files(path):
  return send_from_directory(static_assets_path, path)


@app.route('/api/simulations', methods=['POST'])
def simulations():
  options = request.get_json()

  T = options['T']
  N = options['N']
  Z = options['Z']
  L = options['L']
  delta = options['delta']
  price_min = options['price_min']
  price_max = options['price_max']
  price_step = options['price_step']
  price_range = np.arange(price_min, price_max, price_step, dtype=np.float64)
  iterations = options['counts']

  po = make_price_optimizer(competitor_prices, T=T, N=N, Z=Z, L=L, delta=delta, price_range=price_range)
  result = {
    'policy': list(map(lambda n: { 
        'n': n, 
        'prices': list(map(lambda t: po.run(t, n)[0], range(1, T + 1)))
      }, range(1, N + 1))),
    'simulation': run_simulations(iterations, T=T, N=N, Z=Z, L=L, delta=delta, price_range=price_range)
  }
  return Response(json.dumps(result),  mimetype='application/json')

if __name__ == "__main__":
  # Start the server
  app.run(port=5000)
