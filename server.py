#!/usr/local/bin/python3
from flask import Flask, Response, request, send_from_directory
import json
from os import path
from data import make_model, generate_train_data, change_competitor_prices
from cpp.optimize_price import PriceOptimizer
import numpy as np
from concurrent.futures import ThreadPoolExecutor


static_assets_path = path.join(path.dirname(__file__), "html")
app = Flask(__name__, static_folder=static_assets_path)

def mean(l):
  _l = list(l)
  return sum(_l) / len(_l)

def make_price_optimizer(competitor_prices,
    T, N, price_range, L, delta, Z, time_model, rank_model):

  _, sales_model_coef = make_model(*generate_train_data(1000, T, price_range, time_model, rank_model))
  po = PriceOptimizer(T, N)
  po.L = L
  po.Z = Z
  po.delta = delta
  po.price_range = price_range
  po.sales_model_coef = sales_model_coef
  po.competitor_prices = competitor_prices
  po.run(0, 0)
  return po


def run_simulations(inital_competitor_prices, iterations, initial_optimizer, 
    T, N, price_range, L, delta, Z, time_model, rank_model):

  results = []

  price_history = np.zeros((iterations, T))
  profit_history = np.zeros((iterations, T))
  competitor_prices_history = np.zeros((iterations, T, inital_competitor_prices.size))
  inventory_history = np.zeros((iterations, T))

  competitor_prices = change_competitor_prices(inital_competitor_prices)

  optimizers = list(ThreadPoolExecutor(max_workers=4).map(
    lambda new_prices: make_price_optimizer(new_prices, T, N, price_range, L, delta, Z, time_model, rank_model),
    competitor_prices
  ))
  
  for i in range(iterations):

    price_level = 0

    profit = 0
    n = N
    
    for t in range(0, T):
      price, _ = optimizers[price_level].run(t, n)
      pi = optimizers[price_level].sales_model(price, t)
      sales = min(n, np.random.poisson(pi))
      n = n - sales
      profit += price * sales - L * n

      price_history[i,t] = price
      inventory_history[i,t] = n
      competitor_prices_history[i,t,:] = competitor_prices[price_level]
      profit_history[i,t] = profit

      # Change competitor prices
      if np.random.uniform(0, 1) > 0.9:
        price_level = min(len(optimizers) - 1, price_level + 1)

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
  competitor_prices = np.array(options['competitors'], dtype=np.float64)
  delta = options['delta']
  price_min = options['price_min']
  price_max = options['price_max']
  price_step = options['price_step']
  price_range = np.arange(price_min, price_max, price_step, dtype=np.float64)
  iterations = options['counts']
  time_model = np.array(options['time_model'], dtype=np.float64)
  rank_model = np.array(options['rank_model'], dtype=np.float64)

  po = make_price_optimizer(competitor_prices, T, N, price_range, L, delta, Z, time_model, rank_model)
  result = {
    'policy': list(map(lambda n: { 
        'n': n, 
        'prices': list(map(lambda t: po.run(t, n)[0], range(1, T + 1)))
      }, range(1, N + 1))),
    'simulation': run_simulations(competitor_prices, iterations, po, T, N, price_range, L, delta, Z, time_model, rank_model)
  }
  return Response(json.dumps(result),  mimetype='application/json')

if __name__ == "__main__":
  # Start the server
  app.run(port=5000)
