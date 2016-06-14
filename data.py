import numpy as np
from sklearn import linear_model

# Generate training data for sales probability regression
def rank(a, p):
    _rank = p.shape[0]
    for i in range(p.shape[0]):
        if a < p[i]:
            _rank = _rank - 1
    return _rank

def make_X(price, competitor_prices, t):
    return np.array([
            rank(price, competitor_prices),
            price - competitor_prices.min(),
            rank(price, competitor_prices),
            (price + np.sum(competitor_prices)) / (1 + competitor_prices.size),
            t,
            t * t
        ])

def generate_train_data(B=1000, T=100):
    our_price = np.around(10 + np.random.uniform(0, 10, (B * T, 1)), decimals=2)
    competitor_prices = np.around(10 + np.random.uniform(0, 10, (B * T, 5)), decimals=2)
    
    X = np.zeros((B * T, 6))
    Y = np.zeros(B * T)
    for t in range(T):
        for i in range(B):
            index = t * B + i
            X[index,:] = make_X(our_price[index], competitor_prices[index], t)
            _rank = rank(our_price[index], competitor_prices[index])
            # Y[index] = _rank == 0
            # Y[index] = np.round(np.random.uniform(0, 1)
            #                                   * (0.5 + 0.5 * (1 - _rank / 5))
            #                                   * (0.5 + 0.5 * t / T))
            Y[index] = 5 * t / T * np.random.uniform(0, 1) * (3 - _rank)

    return (X, Y)

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