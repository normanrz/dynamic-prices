# get_ipython().magic('matplotlib inline')
import matplotlib
import numpy as np
import matplotlib.pyplot as plt
from sklearn import linear_model
import functools
from scipy.stats import poisson

# Generate training data for sales probability regression
def generate_train_data(B=100):

    def rank(a, p):
        return np.argsort(np.hstack((a, p)))[:,0]
    
    our_price = 10 + np.random.uniform(0, 10, (B, 1))
    competitor_prices = 10 + np.random.uniform(0, 10, (B, 5))
    our_rank = np.reshape(rank(our_price, competitor_prices), (B, 1))
    X = np.hstack((our_price, competitor_prices, our_rank))
    
    # Y = (our_rank == 0).astype(int).ravel()
    # Y = np.maximum(0, (3 - our_rank)).astype(int).ravel()
    Y = np.round(np.random.uniform(0, 1, our_rank.shape) * (1 - our_rank / 11)).ravel()
    
    return (X, Y)

X, Y = generate_train_data()

# Train sales probability model
def make_model(X, Y):
    regr = linear_model.LinearRegression()
    regr.fit(X, Y)
    def predict(x):
        return np.maximum(0, regr.predict(x))
        # return regr.predict_proba(x)[:, 1]
    return predict

sales_model = make_model(X, Y)

T=20
N=5
price_range=np.arange(10, 20, 0.1) 
L=0.01
delta=0.99
Z=1

# competitor_prices = 10 + np.random.uniform(0, 10, 5)
competitor_prices = np.array([14, 15, 16, 17, 18])
computed_values = {}

def rank(a, p):
    _rank = p.shape[0]
    for i in range(p.shape[0]):
        if a < p[i]:
            _rank = _rank - 1
    return _rank

def _V(price, t, n):
    x = np.hstack((price, competitor_prices, rank(price, competitor_prices))).reshape(1, -1)
    # sales_prob = round(sales_model(x)[0])
    sales_prob = sales_model(x)[0]

    _sum = 0
    # TODO: Check here
    # for i in range(2):

    # print(sales_prob)

    pi_sum = 0
    for i in range(int(poisson.ppf(0.9999, sales_prob)) + 1):
        pi = poisson.pmf(i, sales_prob)
        pi_sum += pi
        today_profit = min(n, i) * price
        holding_costs = n * L
        _, V_future = V(t + 1, max(0, n - i))
        exp_future_profits = delta * V_future
        _sum += pi * (today_profit - holding_costs + exp_future_profits)
    # print(pi_sum)
    return _sum

def V(t, n):
    if (t,n) in computed_values:
        return computed_values[t,n]
    if t >= T:
        computed_values[t,n] = (0, n * Z)
        return (0, n * Z)
    if n <= 0:
        computed_values[t,n] = (0, 0)
        return (0, 0)

    V_opt = -100000
    price_opt = -100000
    for _, price in enumerate(price_range):
        v = _V(price, t, n)
        if v > V_opt:
            V_opt = v
            price_opt = price
            
    computed_values[t,n] = (price_opt, V_opt)
    return (price_opt, V_opt)

V(0, N)

print(computed_values)

for i_n in range(N + 1):
    datapoints = [ computed_values[i_t, i_n][0] for i_t in range(T + 1) if(i_t, i_n) in computed_values ]
    print(datapoints)
    label_text = 'N=' + str(i_n)
    plt.plot(datapoints, label=label_text)    
    plt.ylabel('n')
    plt.xlabel('T')
    plt.legend()
    plt.show()



