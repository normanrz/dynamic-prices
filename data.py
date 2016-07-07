import numpy as np
from sklearn import linear_model

# Generate training data for sales probability regression
def rank(a, p):
    _rank = p.shape[0]
    for i in range(p.shape[0]):
        if a < p[i]:
            _rank = _rank - 1
    return _rank

def make_X(price, competitor_prices, t, T):
    _t = t / T
    return np.array([
            rank(price, competitor_prices),
            price - competitor_prices.min(),
            price,
            t,
            t * t,
            t * rank(price, competitor_prices),
            np.sqrt(t),
            (1 - _t) * (1 - _t) * (1 - _t),
            _t * (1 - _t) * (1 - _t),
            _t * _t * (1 - _t),
            _t * _t * _t
        ])

def generate_train_data(B, T, price_range, time_model):
    our_price = np.random.choice(price_range, (B * T, 1))
    competitor_prices = np.random.choice(price_range, (B * T, 3))
    
    X = np.zeros((B * T, 11))
    Y = np.zeros(B * T)
    for t in range(T):
        for i in range(B):
            index = t * B + i
            x = make_X(our_price[index], competitor_prices[index], t, T)
            X[index,:] = x

            _rank = rank(our_price[index], competitor_prices[index])
            y = 5 * (time_model[0] * x[7] + time_model[1] * 3 * x[8] + time_model[2] * 3 * x[9] + time_model[3] * x[10]) + \
                2 * (competitor_prices.shape[1] - _rank - 1)
            Y[index] = y * np.random.uniform(0, 1)

    return (X, Y)

def change_competitor_prices(inital_competitor_prices):
    competitor_prices = [inital_competitor_prices]
    for i in range(5):
        competitor_prices.append(
            competitor_prices[-1] * np.random.uniform(0.98, 1.2, inital_competitor_prices.size))
    return competitor_prices

# Train sales probability model
def make_model(X, Y):
    regr = linear_model.LinearRegression()
    regr.fit(X, Y)
    coef = np.concatenate((regr.intercept_.ravel(), regr.coef_.ravel()))
    def predict(x):
        x = np.hstack((np.ones((x.shape[0], 1)), x))
        return np.maximum(0, np.dot(x, coef))
        # return regr.predict_proba(x)[:, 1]
    return predict, coef