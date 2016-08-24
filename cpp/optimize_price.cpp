#include <vector>
#include <utility>
#include <Python.h>
#include <boost/python.hpp>
#include <boost/python/numeric.hpp>
#include <boost/python/tuple.hpp>
#include "PriceOptimizer.cpp"
using namespace boost::python;

class ReleaseGIL {
public:
  inline ReleaseGIL() {
    save_state = PyEval_SaveThread();
  }

  inline ~ReleaseGIL() {
    PyEval_RestoreThread(save_state);
  }
private:
  PyThreadState *save_state;
};

std::vector<double> ndarray_to_vector(const numeric::array& l) {
  std::vector<double> result;
  for (int i = 0; i < len(l); ++i) {
    double item = boost::python::extract<double>(l[i]);
    result.push_back(item);
  }
  return result;
}

void set_price_range(PriceOptimizer* self, const numeric::array& l) {
  self->price_range = ndarray_to_vector(l);
}
void set_competitor_prices(PriceOptimizer* self, const numeric::array& l) {
  self->competitor_prices = ndarray_to_vector(l);
}
void set_sales_model_coef(PriceOptimizer* self, const numeric::array& l) {
  self->sales_model_coef = ndarray_to_vector(l);
}

void noop(PriceOptimizer * self) {}

tuple run(PriceOptimizer * self, int t, int n) {
  auto unlockGIL = ReleaseGIL();
  auto price_pair = self->run(t, n);
  return make_tuple(price_pair.first, price_pair.second);
}

BOOST_PYTHON_MODULE(optimize_price)
{
  PyEval_InitThreads();
  numeric::array::set_module_and_type("numpy", "ndarray");

  class_<PriceOptimizer>("PriceOptimizer", init<int, int>())
    .def("run", &run)
    .def("sales_model", &PriceOptimizer::sales_model)
    .def_readonly("T", &PriceOptimizer::T)
    .def_readonly("N", &PriceOptimizer::N)
    .def_readwrite("L", &PriceOptimizer::L)
    .def_readwrite("Z", &PriceOptimizer::Z)
    .def_readwrite("delta", &PriceOptimizer::delta)
    .add_property("price_range", &noop, &set_price_range)
    .add_property("competitor_prices", &noop, &set_competitor_prices)
    .add_property("sales_model_coef", &noop, &set_sales_model_coef)
  ;
}
