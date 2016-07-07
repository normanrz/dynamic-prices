#include <vector>
#include <utility>
#include <algorithm>
#include <cmath>
#include <numeric>
#include <iostream>

using PricePair = std::pair<double, double>;
template<class T> 
using Grid = std::vector<std::vector<T>>;

void print_vec(std::vector<double> vec) {
  for(const double& value: vec) {
    std::cout << value << ' ';
  }
  std::cout << std::endl;
}

void print_pair(PricePair pair) {
  std::cout << pair.first << ' ' << pair.second << std::endl;
}

double dot_product(std::vector<double> a, std::vector<double> b) {
  double sum = 0;
  for (int i = 0; i < std::min(a.size(), b.size()); i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

double sigmoid(double a) {
  return 1.0 / (1.0 + std::exp(-a));
}

int rank(double price, const std::vector<double>& competitor_prices) {
  int rank = competitor_prices.size();
  for (int i = 0; i < competitor_prices.size(); i++) {
    if (price < competitor_prices[i]) {
      rank = rank - 1;
    }
  }
  return rank;
}

unsigned int factorial(unsigned int n) {
  return (n == 0) ? 1 : n * factorial(n - 1);
}

double poisson_pdf(unsigned int i, double mu) {
  return std::pow(mu, i) / factorial(i) * std::exp(-mu);
}

unsigned int poisson_ppf(double mu, double q) {
  double sum = 0;
  unsigned int i = 0;
  while(sum < q) {
    sum += poisson_pdf(i, mu);
    i++;
  }
  return i;
}

double predict_logistic_regression(const std::vector<double>& x, const std::vector<double>& coeff) {
  return sigmoid(dot_product(x, coeff));
}

double predict_linear_regression(const std::vector<double>& x, const std::vector<double>& coeff) {
  return std::max(0., dot_product(x, coeff));
}

class PriceOptimizer {
  public:
    PriceOptimizer(int, int);
    int T;
    int N;
    double L = 0.1;
    double Z = 0.5;
    double delta = 0.99;
    std::vector<double> price_range = {};
    std::vector<double> competitor_prices = {};
    std::vector<double> sales_model_coef = {};
    PricePair run(int, int);
    double sales_model(double, int);

  private:
    Grid<PricePair> cache;
    static PricePair cache_default;

    double _V(double, int, int);
    PricePair V_impl(int, int);
    PricePair V(int, int);
};

PricePair PriceOptimizer::cache_default = 
  std::make_pair(-100000., -100000.);

PriceOptimizer::PriceOptimizer(int T, int N) : T(T), N(N) {
  std::vector<PricePair> cache_list(N + 1);
  std::fill(cache_list.begin(), cache_list.end(), cache_default);
  cache = Grid<PricePair>(T + 1);
  std::fill(cache.begin(), cache.end(), cache_list);
}

double PriceOptimizer::_V(double price, int t, int n) {
  double p = sales_model(price, t);
  double sum = 0;
  int i_max = poisson_ppf(p, 0.9999);
  for (int i = 0; i < i_max; i++) {
    if (i > n) {
      break;
    }
    double pi = poisson_pdf(i, p);
    double today_profit = std::min(n, i) * price;
    double holding_costs = n * L;
    double V_future = V(t + 1, std::max(0, n - i)).second;
    double exp_future_profits = delta * V_future;
    sum += pi * (today_profit - holding_costs + exp_future_profits);
  }
  return sum;
}

PricePair PriceOptimizer::V_impl(int t, int n) {
  if (t >= T) {
    return std::make_pair(0, n * Z);
  }
  if (n <= 0) {
    return std::make_pair(0, 0);
  }

  PricePair price_opt_pair;

  for (double price: price_range) {
    double v = _V(price, t, n);
    if (v > price_opt_pair.second) { 
      price_opt_pair = std::make_pair(price, v);
    }
  }
  return price_opt_pair;
}

PricePair PriceOptimizer::V(int t, int n) {
  if (cache[t][n] != cache_default) {
    return cache[t][n];
  }

  PricePair price_pair = V_impl(t, n);
  cache[t][n] = price_pair;
  
  // printf("%d %d %f %f\n", t, n, price_pair.first, price_pair.second);
  return price_pair;
}

std::pair<double, double> PriceOptimizer::run(int t, int n) {
  return V(t, n);
}

double PriceOptimizer::sales_model(double price, int t) {
  double _t = double(t) / T;
  double _rank = double(rank(price, competitor_prices)) / competitor_prices.size();
  std::vector<double> x = {
    1,
    double(_rank),
    price - *std::min_element(competitor_prices.begin(), competitor_prices.end()),
    price,
    double(_t),
    double(_t * _t),
    double(_t * _rank),
    std::sqrt(_t),
    double((1 - _t) * (1 - _t) * (1 - _t)),
    double(_t * (1 - _t) * (1 - _t)),
    double(_t * _t * (1 - _t)),
    double(_t * _t * _t),
    double((1 - _rank) * (1 - _rank) * (1 - _rank)),
    double(_rank * (1 - _rank) * (1 - _rank)),
    double(_rank * _rank * (1 - _rank)),
    double(_rank * _rank * _rank)
  };
  return predict_linear_regression(x, sales_model_coef);
}
