import numpy as np
from sklearn import linear_model
from timeit import default_timer as timer

def rank(a, p):
    array = np.hstack((a.reshape(-1, 1), p))
    order = array.argsort(axis=1)
    ranks = order.argsort(axis=1)
    return ranks[:, 0]

def make_X(price, competitor_prices, t, T):
    ranks = rank(price, competitor_prices)
    _ranks = ranks / competitor_prices.shape[1]
    _t = t / T

    return np.vstack((
        _ranks,
        price - competitor_prices.min(axis=1),
        price,
        _t,
        _t * _t,
        _t * _ranks,
        np.sqrt(_t),
        (1 - _t) * (1 - _t) * (1 - _t),
        _t * (1 - _t) * (1 - _t),
        _t * _t * (1 - _t),
        _t * _t * _t,
        (1 - _ranks) * (1 - _ranks) * (1 - _ranks),
        _ranks * (1 - _ranks) * (1 - _ranks),
        _ranks * _ranks * (1 - _ranks),
        _ranks * _ranks * _ranks
    )).transpose()

def generate_train_data(B, T, price_range, time_model, rank_model):
    our_price = np.random.choice(price_range, B * T)
    competitor_prices = np.random.choice(price_range, (B * T, 3))

    X = make_X(our_price, competitor_prices, np.repeat(np.arange(0, T), B), T)
    Y = (
            time_model[0] * X[:, 7] + time_model[1] * 3 * X[:, 8] + 
            time_model[2] * 3 * X[:, 9] + time_model[3] * X[:, 10] + 
            rank_model[0] * X[:, 11] + rank_model[1] * 3 * X[:, 12] + 
            rank_model[2] * 3 * X[:, 13] + rank_model[3] * X[:, 14]
        ) * np.random.uniform(0, 1, B * T)

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