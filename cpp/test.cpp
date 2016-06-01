#include "PriceOptimizer.cpp"

std::vector<double> make_range(double low, double high, double step) {
  std::vector<double> result;
  for (double i = low; i < high; i += step) {
    result.push_back(i);
  }
  return result;
}


int main() {
  int T = 100;
  int N = 50;

  PriceOptimizer optimizer(T, N);
  optimizer.L = 0.1;
  optimizer.Z = 0.5;
  optimizer.delta = 0.5;
  optimizer.price_range = make_range(0, 20, 0.2);
  optimizer.competitor_prices = { 18.8499023, 18.11579391, 19.45479663, 13.46963515, 18.60114321 };
  optimizer.sales_model_coeff = { 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3 };

  std::pair<double, double> price_pair = optimizer.run(0, N);
  printf("final: %f %f\n", std::get<0>(price_pair), std::get<1>(price_pair));

  return 0;
}
