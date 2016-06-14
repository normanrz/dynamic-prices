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

@app.route('/api/simulation', methods=['POST'])
def simulation():
  options = request.get_json()
  js = {
    'self': [1, 2],
    'competitors': [[2, 3], [3, 4]],
    'options': options
  }
  return Response(json.dumps(js),  mimetype='application/json')

if __name__ == "__main__":
  # Start the server
  app.run(port=5000)
