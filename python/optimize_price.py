import numpy as np
from scipy.stats import poisson

class PriceOptimizer():
    def __init__(self, sales_model_coef, competitor_prices,
               T=20, N=15,
               price_range=np.arange(10, 20, 1), 
               L=0.01, delta=0.99, Z=0.5):
        self.sales_model_coef = sales_model_coef
        self.competitor_prices = competitor_prices
        self.T = T # max. time intervals
        self.N = N # max. items
        # self.M = M # reference items sold per interval
        self.price_range = price_range # acceptable price range
        self.L = L # holding cost per item
        self.delta = delta # discount factor for future sales
        self.Z = Z # salvage profits
        self.cache = {}
        self.make_X = None


    def sales_prob(self, price, t):
        x = np.concatenate(([1], self.make_X(price, self.competitor_prices, t)))
        return np.maximum(0, np.dot(x, self.sales_model_coef))


    def _V(self, price, t, n):
        p = self.sales_prob(price, t)
        _sum = 0
        for i in range(int(poisson.ppf(0.9999, p)) + 1):
            if i > n:
                break
            pi = poisson.pmf(i, p)
            today_profit = min(n, i) * price
            holding_costs = n * self.L
            _, V_future = self.V(t + 1, max(0, n - i))
            exp_future_profits = self.delta * V_future
            _sum += pi * (today_profit - holding_costs + exp_future_profits)
        return _sum

    def V_impl(self, t, n):
        if t >= self.T:
            return (0, n * self.Z)
        if n <= 0:
            return (0, 0)

        V_opt = -100000
        price_opt = -100000
        for price in self.price_range:
            v = self._V(price, t, n)
            if v > V_opt:
                V_opt = v
                price_opt = price
                
        return (price_opt, V_opt)

    def V(self, t, n):
        if (t,n) in self.cache:
            return self.cache[t,n]
        
        price_pair = self.V_impl(t, n)
        self.cache[t,n] = price_pair

        # print(t, n, price_opt, V_opt)
        return price_pair

    def run(self, t, n):
        return self.V(t, n)
