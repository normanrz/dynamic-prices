#!/usr/local/bin/python3
from flask import Flask, Response, request, send_from_directory
import json
from os import path
from data import make_model, generate_train_data
from cpp.optimize_price import PriceOptimizer
import numpy as np

static_assets_path = path.join(path.dirname(__file__), "html")
app = Flask(__name__, static_folder=static_assets_path)

_, sales_model_coef = make_model(*generate_train_data(1000, 100))
competitor_prices = np.array([11., 13., 14., 16., 18.])
def make_price_optimizer(sales_model_coef, competitor_prices,
    T=20, N=15,
    price_range=np.arange(10, 20, 0.1), 
    L=0.01, delta=0.99, Z=0.5):
  po = PriceOptimizer(T, N)
  po.L = L
  po.Z = Z
  po.delta = delta
  po.price_range = price_range
  po.competitor_prices = competitor_prices
  po.sales_model_coef = sales_model_coef
  return po

def run_simulations(T, N, iterations):

  results = []
  optimizer = make_price_optimizer(sales_model_coef, competitor_prices, T=T, N=N)

  L = optimizer.L
  Z = optimizer.Z
  
  for i in range(iterations):
    price_history = []
    competitor_prices_history = []
    accumulated_sales = []

    profit = 0
    n = N
    
    for t in range(0, T):
      price, V = optimizer.run(t, n)
      pi = optimizer.sales_model(price, t)
      sales = min(n, np.random.poisson(pi))
      n = n - sales
      profit += price * sales - L * n

      price_history.append(price)
      accumulated_sales.append(N - n)
      competitor_prices_history.append(competitor_prices.tolist())

      # # Change competitor prices
      # competitor_prices = competitor_prices * np.random.uniform(0.8, 1.2, 5)
      # optimizer = PriceOptimizer(sales_model, competitor_prices, N=n, T=T, L=L, Z=Z)

    # Realize salvage profits
    profit += n * Z
    
    results.append({
      'self': price_history,
      'competitors': competitor_prices_history,
      'sales': accumulated_sales,
      'profit': profit,
    })

  return results


@app.route('/')
def index():
  return app.send_static_file('index.html')

@app.route('/<path:path>')
def send_static_files(path):
  return send_from_directory(static_assets_path, path)

@app.route('/api/pricing_policy', methods=['POST'])
def pricing_policy():
  options = request.get_json()
  T = options['T']
  N = options['N']
  po = make_price_optimizer(sales_model_coef, competitor_prices, T=T, N=N)
  result = list(map(lambda n: { 
    'n': n, 
    'prices': list(map(lambda t: po.run(t, n)[0], range(1, T + 1))) 
  }, range(1, N + 1)))
  return Response(json.dumps(result),  mimetype='application/json')

@app.route('/api/simulations', methods=['POST'])
def simulations():
  options = request.get_json()
  T = options['T']
  N = options['N']
  iterations = options['counts']
  results = run_simulations(T, N, iterations)
  return Response(json.dumps(results),  mimetype='application/json')

if __name__ == "__main__":
  # Start the server
  app.run(port=5000)
