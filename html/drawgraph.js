d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

const tooltip = d3.select('body').append('div') 
    .attr('class', 'tooltip')       
    .style('opacity', 0); 

const margin = { top: 20, right: 20, bottom: 20, left: 20 };

class LineChart {
  constructor(height, T, N, max_price, divToDraw) {
    this.data = []
    this.width = divToDraw.node().getBoundingClientRect().width - margin.left - margin.right,
    this.height = height - margin.top - margin.bottom;

    this.x = d3.scale.linear()
      .domain([0, T])
      .range([0, this.width]);
      
    this.y = d3.scale.linear()
      .domain([0, max_price])
      .range([this.height, 0]);

    const xAxis = d3.svg.axis()
      .scale(this.x)
      .orient('bottom');

    const yAxis = d3.svg.axis()
      .scale(this.y)
      .orient('left');

    this.line = d3.svg.line()
      .x((d, i) => this.x(i))
      .y((d, i) => this.y(d));

    this.svg = divToDraw.append('svg')
      .attr('class', 'chart')
      .attr('width', this.width + margin.left + margin.right)
      .attr('height', this.height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    this.svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(-1, ${(this.height + 1)})`)
      .call(xAxis)
    .append('text')
      .attr('x', this.width - 2 * this.width/T) // margin to no write on the pricingpolicys
      .attr('dy', '-.71em')
      .style('text-anchor', 'end')
      .text('Time');

    this.svg.append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(-1,1)')
      .call(yAxis)
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Price');
  }
}

class PricingPolicyChart extends LineChart {

  drawLine(prices, n) {
    function mouseOver() {
      let focusLine = d3.select(this)
        .attr('stroke', 'grey')
        .moveToFront();

      $(`#selectN div[n='${focusLine.attr('id')}'`).css('color', 'grey');
    }

    const self = this;
    function mouseMove() {
      const n = parseInt(d3.select(this).attr('id')) - 1;
      const time = Math.round(self.x.invert(d3.mouse(this)[0]));
      const price = self.data[n][time].toFixed(2);

      tooltip.transition()
        .delay(1000)    
        .duration(100)    
        .style('opacity', .9);    
      tooltip.html(`${time}, ${price}`)  
        .style('left', `${d3.event.pageX}px`)   
        .style('top', `${(d3.event.pageY - 20)}px`);        
    }

    function mouseOut() {
      d3.select(this).attr('stroke', 'whitesmoke');
      $('#selectN div').css('color', 'whitesmoke');
      tooltip.transition()
        .duration(100)
        .style('opacity', 0)
    }

    function hoverIn() {
      $(this).css('color', 'grey');
      const n = $(this).attr('n');
      const line = d3.select(`.line[id='${n}']`);
      line.moveToFront();
      line.attr('stroke', 'grey');
    }

    function hoverOut() {
      $(this).css('color', 'whitesmoke');
      const n = $(this).attr('n');
      const line = d3.select(`.line[id='${n}']`);
      line.attr('stroke', 'whitesmoke');
    }

    this.data.push(prices);
    let newDiv = $('<div></div>').text(`N=${n}`);
    newDiv.hover(hoverIn, hoverOut);
    newDiv.attr('n', n);
    newDiv.css('color', 'whitesmoke');
    $('#selectN').append(newDiv);

    this.svg.append('path')
      .attr('id', n)
      .attr('class', 'line')
      .attr('stroke', 'whitesmoke')
      .on('mouseover', mouseOver)
      .on('mouseout', mouseOut)
      .on('mousemove', mouseMove)
      .attr('d', this.line(prices));
  }
}

class SimulationResultChart extends LineChart {
  drawLine(prices, primary) {
    let color = 'whitesmoke';
    if (primary) color = 'grey';

    this.svg.append('path')
      .attr('class', 'sim-line')
      .attr('stroke', color)
      // .on('mouseover', mouseOver)
      // .on('mouseout', mouseOut)
      // .on('mousemove', mouseMove)
      .attr('d', this.line(prices));
  }
}

function histogramChart() {
  var margin = {top: 0, right: 0, bottom: 20, left: 0},
      width = 960,
      height = 500;

  var histogram = d3.layout.histogram(),
      x = d3.scale.ordinal(),
      y = d3.scale.linear(),
      xAxis = d3.svg.axis().scale(x).orient("bottom").tickSize(6, 0);

  function chart(selection) {
    selection.each(function(data) {

      // Compute the histogram.
      data = histogram(data);

      // Update the x-scale.
      x   .domain(data.map(function(d) { return d.x; }))
          .rangeRoundBands([0, width - margin.left - margin.right], .1);

      // Update the y-scale.
      y   .domain([0, d3.max(data, function(d) { return d.y; })])
          .range([height - margin.top - margin.bottom, 0]);

      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll("svg").data([data]);

      // Otherwise, create the skeletal chart.
      var gEnter = svg.enter().append("svg").append("g");
      gEnter.append("g").attr("class", "bars");
      gEnter.append("g").attr("class", "x axis");

      // Update the outer dimensions.
      svg .attr("width", width)
          .attr("height", height);

      // Update the inner dimensions.
      var g = svg.select("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Update the bars.
      var bar = svg.select(".bars").selectAll(".bar").data(data);
      bar.enter().append("rect");
      bar.exit().remove();
      bar .attr("width", x.rangeBand())
          .attr("x", function(d) { return x(d.x); })
          .attr("y", function(d) { return y(d.y); })
          .attr("height", function(d) { return y.range()[0] - y(d.y); })
          .order();

      // Update the x-axis.
      g.select(".x.axis")
          .attr("transform", "translate(0," + y.range()[0] + ")")
          .call(xAxis);
    });
  }

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  // Expose the histogram's value, range and bins method.
  d3.rebind(chart, histogram, "value", "range", "bins");

  // Expose the x-axis' tickFormat method.
  d3.rebind(chart, xAxis, "tickFormat");

  return chart;
}

$('.add-competitor').click( (e) => {
  $('#competitors div:first').clone().appendTo('#competitors');
})

function range(count) {
  let result = [];
  for (let i = 0; i < count; i++) {
    result.push(i);
  }
  return result;
}


$(document).ready(function(){
  const T = 100;
  const N = 20;
  const L = 1;
  const Z = 0.5;
  const delta = 0.99;
  const min_price = 10;
  const max_price = 20;
  const price_steps = 0.1;
  const counts = 100;

  function randomArray(length) {
    return Array.apply(null, Array(length)).map(function(_, i) {
      return Math.random() * max_price;
    });
  }

  $("form").submit(function(){
    $.post($(this).attr("action"), $(this).serialize(), function(jsonData){
      console.log(jsonData);
    }, "json");
  });

  fetch('/api/pricing_policy', { 
    method: 'POST', 
    body: JSON.stringify({ T, N, L, Z, delta, min_price, max_price, price_steps }), 
    headers: { 'Content-Type': 'application/json' }
  }).then(res => res.json())
    .then(result => {
      pricingPolicyChart = new PricingPolicyChart(400, T, N, max_price, d3.select('#pricingpolicy'));
      result.forEach(row => pricingPolicyChart.drawLine(row.prices, row.n));

      fetch('/api/simulations', {
        method: 'POST',
        body: JSON.stringify({ T, N, L, Z, delta, min_price, max_price, price_steps, counts }),
        headers: { 'Content-Type': 'application/json' },
      }).then(res => res.json())
        .then(json => {

        let results = [];
        let competitors_count = json.all.competitors[0][0].length;
        for (let i = 0; i < counts; i++) {
          results[i] = {
            profit: json.all.profit[i][json.all.profit[i].length - 1],
            self: json.all.price[i],
            competitors: range(competitors_count).map(
              (_, j) => json.all.competitors[i].map(c => c[j])),
          };

        }

        results.slice(0, 12).forEach(row => {

          console.log(row);

          const newDiv = $('<div></div>')
            .addClass('col-md-3')
            .addClass('text-center');
          $('#sim').append(newDiv);

          let chart = new SimulationResultChart(200, T, N, max_price, d3.select(newDiv.get()[0]));
          row.competitors.forEach( c => chart.drawLine(c, false));
          chart.drawLine(row.self, true);


          const newLabel = $('<div></div>')
            .html(Math.round(row.profit))
            .addClass('label')
            .addClass('label-default');
          newDiv.append(newLabel);

          // const newB = $('<button></button')
          //   .text('Details')
          //   .addClass('btn')
          //   .addClass('btn-default')
          //   .addClass('btn-xs');
          // newDiv.append(newB);

        });

        d3.select("#histogram")
          .datum(results.map(a => a.profit))
          .call(histogramChart()
            .bins(10)
            .tickFormat(d3.format(".02f")));
      })
  })

});
