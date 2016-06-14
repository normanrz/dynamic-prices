from optimize_price import PriceOptimizer 
import numpy as np

po = PriceOptimizer(20, 15)
po.L = 0.01
po.Z = 0.5
po.delta = 0.99
po.price_range = np.arange(0, 20, 0.1)
po.competitor_prices = np.array([ 16.36228384,  17.92797158,  14.40080137,  11.25724152,  12.51570613])
po.sales_model_coeff = np.array([ -0.04243947, -0.35706217, -0.02488067, -0.21219736,  0.07839903, 0. ])

print(po.run(0, 15))
