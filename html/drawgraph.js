d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

let points = {
  time: [[0.01, 1], [1/3, 1.5], [2/3, 3], [1, 7]],
  rank: [[0.01, 4], [1/3, 2], [2/3, 0], [1, -3]],
};

const tooltip = d3.select('body').append('div') 
  .attr('class', 'tooltip')       
  .style('opacity', 0); 

const margin = { top: 30, right: 30, bottom: 30, left: 30 };

class LineChart {
  constructor(height, xMax, yMax, divToDraw, xLabel, yLabel, yMin = 0) {
    this.data = [];
    this.width = divToDraw.node().getBoundingClientRect().width - margin.left - margin.right;
    this.height = height - margin.top - margin.bottom;

    this.x = d3.scale.linear()
      .domain([0, xMax])
      .range([0, this.width]);
      
    this.y = d3.scale.linear()
      .domain([yMin, yMax])
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

    this.svg = divToDraw.html('').append('svg')
      .attr('class', 'chart')
      .attr('width', this.width + margin.left + margin.right)
      .attr('height', this.height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    this.xAxisObject = this.svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(-1, ${( + 1 + this.y(0))})`)
      .call(xAxis);

    this.xAxisObject
      .append('text')
        .attr('x', this.width)
        // .attr('x', this.width - 2 * this.width/xMax)
        .attr('dy', '-.71em')
        .style('text-anchor', 'end')
        .text(xLabel);

    this.svg.append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(-1,1)')
      .call(yAxis)
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text(yLabel);
  }

  drawLine(prices, primary) {
    const self = this;
    function mouseMove() {
      const x = Math.round(100 * self.x.invert(d3.mouse(this)[0])) / 100;
      const y = Math.round(100 * self.y.invert(d3.mouse(this)[1])) / 100;

      tooltip.transition()
        .delay(100)    
        .duration(100)    
        .style('opacity', .9);    
      tooltip.html(`${x}, ${y}`)  
        .style('left', `${d3.event.pageX}px`)   
        .style('top', `${(d3.event.pageY - 20)}px`);        
    }
    let color = 'lightgrey';
    if (primary) color = 'grey';

    function mouseOut() {
      if (primary) return;
      d3.select(this).attr('stroke', 'lightgrey');
      if (self._primaryLine) self._primaryLine.moveToFront();


      self.xAxisObject.moveToFront();
    }
    function mouseOver() {
      if (primary) return;
      d3.select(this).attr('stroke', 'black').moveToFront();
    }

    let line = this.svg.append('path')
      .attr('class', 'line')
      .attr('stroke', color)
      .on('mousemove', mouseMove)
      .on('mouseover', mouseOver)
      .on('mouseout', mouseOut)
      .attr('d', this.line(prices));

    if (primary) {
      this._primaryLine = line;
    }
  }

}

class PricingPolicyChart extends LineChart {
  drawLine(prices, n) {
    function mouseOver() {
      let focusLine = d3.select(this)
        .attr('stroke', 'black')
        .moveToFront();

      $(`#selectN div[n='${focusLine.attr('id')}'`)
        .css('color', 'white')
        .css('background-color', 'grey');
      console.log(n);
      $("#selectN").scrollTop($("#selectN").scrollTop() + $(`#selectN div[n='${focusLine.attr('id')}'`).position().top - 150 );

    }

    const self = this;
    function mouseMove() {
      const n = parseInt(d3.select(this).attr('id')) - 1;
      const time = Math.round(self.x.invert(d3.mouse(this)[0]));
      const price = self.data[n][time].toFixed(2);

      tooltip.transition()
        .delay(100)    
        .duration(100)    
        .style('opacity', .9);    
      tooltip.html(`${time}, ${price}`)  
        .style('left', `${d3.event.pageX}px`)   
        .style('top', `${(d3.event.pageY - 20)}px`);        
    }

    function mouseOut() {
      d3.select(this).attr('stroke', 'lightgrey');
      $('#selectN > div')
        .css('color', 'black')
        .css('background-color', 'lightgrey');
      tooltip.transition()
        .duration(100)
        .style('opacity', 0);
    }

    function hoverIn() {
      $(this)
        .css('color', 'white')
        .css('background-color', 'grey');
      const n = $(this).attr('n');
      const line = d3.select(`.line[id='${n}']`);
      line.moveToFront();
      line.attr('stroke', 'black');
    }

    function hoverOut() {
      $(this)
        .css('color', 'black')
        .css('background-color', 'lightgrey');
      const n = $(this).attr('n');
      const line = d3.select(`.line[id='${n}']`);
      line.attr('stroke', 'lightgrey');
    }

    this.data.push(prices);
    let newDiv = $('<div></div>')
      .text(n)
      .hover(hoverIn, hoverOut)
      .css('color', 'black')
      .css('background-color', 'lightgrey')
      .attr('n', n);
    $('#selectN').append(newDiv);

    this.svg.append('path')
      .attr('id', n)
      .attr('class', 'line')
      .attr('stroke', 'lightgrey')
      .on('mouseover', mouseOver)
      .on('mouseout', mouseOut)
      .on('mousemove', mouseMove)
      .attr('d', this.line(prices));
  }
}

function histogramChart() {
  let margin = { top: 20, right: 0, bottom: 20, left: 0 },
      width = 960,
      height = 500;

  let histogram = d3.layout.histogram(),
      x = d3.scale.ordinal(),
      y = d3.scale.linear(),
      xAxis = d3.svg.axis().scale(x).orient("bottom").tickSize(6, 0);

  function chart(selection) {
    selection.each(function(data) {
      const average = data.reduce((a, b) => (a + b)) / data.length;

      const oldData = data;

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

      const xAvg = d3.scale.linear().domain([d3.min(data, d => d.x), d3.max(data, d => d.x)]).range([0, width]);

      svg.append("line")
        .style("stroke", "black")
        .attr("x1", xAvg(average))
        .attr("y1", -10)
        .attr("x2", xAvg(average))
        .attr("y2", 500 - margin.bottom);

      svg.append("text")
        .attr('x', xAvg(average) + 5)
        .attr('y', 10)
        .text(`avg: ~ ${average.toFixed(2)}`)
        .attr('font-size', '10px');


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

function fetchAll(options) {
  let { T, N, price_max, counts } = options;
  options.time_model = points.time.map(a => a[1]);
  options.rank_model = points.rank.map(a => a[1]);

  $('#diagrams').html('<span class="glyphicon glyphicon-refresh spinning" aria-hidden="true"></span>');
  setTimeout(function () {
    fetch('/api/simulations', { 
      method: 'POST', 
      body: JSON.stringify(options), 
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(({ policy, simulation }) => {
        $("#diagrams").html(`
          <div class="row">
            <h3 class="text-center">Optimal Pricing Policy</h3>
            <div class="col-xs-12 col-md-10">
              <div id="pricingpolicy"></div> 
            </div>
            <div class="col-xs-12 col-md-2">
              <h4>Select N</h4><div id="selectN"></div>
            </div>
          </div>
          <h3 class="text-center">Simulation Summary</h3>
          <div class="row">
            <div class="col-md-6">
              <h4 class="text-center">Prices</h4>
              <div class="row" id="avgPrices"></div>
            </div>
            <div class="col-md-6">
              <h4 class="text-center">Inventory</h4>
              <div class="row" id="avgInventory"></div>
            </div>
            <div class="col-md-6">
              <h4 class="text-center">Profit</h4>
              <div class="row" id="avgProfit"></div>
            </div>
            <div class="col-md-6">
              <h4 class="text-center">Out Of Stock Probability</h4>
              <div class="row" id="endProbability"></div>
            </div>
          </div>
          <h4 class="text-center">Profit Histogram</h4>
          <div class="row" id="histogram"></div>
          <h3 class="text-center">Simulations</h3> 
          <div class="row" id="sim"></div>`);


        let pricingPolicyChart = new PricingPolicyChart(400, T, price_max, d3.select('#pricingpolicy'), 'Time', 'Price');
        
        policy.forEach(row => pricingPolicyChart.drawLine(row.prices, row.n));

        let results = [];
        const competitors_count = simulation.all.competitors[0][0].length;
        let competitorsIds = [];
        for(let i = 0; i < competitors_count; i++)
          competitorsIds.push(i);
        for (let i = 0; i < counts; i++) {
          results[i] = {
            profit: simulation.all.profit[i][simulation.all.profit[i].length - 1],
            self: simulation.all.price[i],
            competitors: competitorsIds.map(j => simulation.all.competitors[i].map(c => c[j])),
          }
        }

        results.slice(0, 12).forEach(row => {
          const newDiv = $('<div></div>')
            .addClass('col-md-3')
            .addClass('text-center');
          $('#sim').append(newDiv);

          let chart = new LineChart(200, T, price_max, d3.select(newDiv.get()[0]), 'Time', 'Price');
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

        // draw histogram
        d3.select("#histogram")
          .datum(results.map(a => a.profit))
          .call(histogramChart()
          .bins(20)
          .tickFormat(d3.format(".02f")));

        const summaryChartsHeight = 300;
        // draw other line charts
        const salesChart = new LineChart(summaryChartsHeight, T, N, d3.select('#avgInventory'), 'Time', 'Items');
        simulation.all.inventory.forEach( x => salesChart.drawLine(x, false));
        salesChart.drawLine(simulation.averages.inventory, true); 

        const priceChart = new LineChart(summaryChartsHeight, T, price_max, d3.select('#avgPrices'), 'Time', 'Price');
        simulation.all.price.forEach( x => priceChart.drawLine(x, false));
        priceChart.drawLine(simulation.averages.price, true);

        const endProbabilityChart = new LineChart(summaryChartsHeight, T, 1, d3.select('#endProbability'), 'Time', 'Probability');
        endProbabilityChart.drawLine(simulation.averages.end_probability, true);

        // const maxProfitGuess = simulation.averages.profit[simulation.averages.profit.length - 1] * 1.5;
        // const minProfitGuess = -simulation.averages.profit[simulation.averages.profit.length - 1] * 0.5;
        // const yMin = Math.min(maxProfitGuess, minProfitGuess);
        // const yMax = Math.max(maxProfitGuess, minProfitGuess);

        const tempAll = simulation.all.profit.reduce( (x, y) => x.concat(y));
        const yMin = d3.min(tempAll);
        const yMax = d3.max(tempAll);

        const profitChart = new LineChart(summaryChartsHeight, T, yMax, d3.select('#avgProfit'), 'Time', 'Profit', yMin);
        simulation.all.profit.forEach( x => profitChart.drawLine(x, false));
        profitChart.drawLine(simulation.averages.profit, true); 

        d3.selectAll('.axis').moveToFront();

      })
      .catch((err) => {
        $('#diagrams').html('<p><strong>Error:</strong> ' + err + '</p><pre>' + err.stack + '</pre>');
      });
  }, 1);
}

function makeDrawableGraph(pointsAttr, selectorString, xLabel, yLabel, rangeY = [0, 1]) {
  let dragged;
  let selected;

  const margin = { top: 30, right: 30, bottom: 30, left: 30 };

  let width = $(selectorString).width() - margin.left - margin.right;
  let height = 300  - margin.top - margin.bottom;

  let x = d3.scale.linear()
    .range([margin.left, width]);
  let y = d3.scale.linear()
    .domain(rangeY)
    .range([height,0]);

  let pointsCoordinates = points[pointsAttr].map(p => [x(p[0]), y(p[1])]);

  dragged = null,
      selected = pointsCoordinates[0];

  let line = d3.svg.line().interpolate('basis');

  let svg = d3.select(selectorString).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

  svg.append("rect")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)

  svg.append("path")
      .datum(pointsCoordinates)
      .attr("class", "line")
      .call(redraw);

  const xAxis = d3.svg.axis()
    .scale(x)
    .ticks(1)
    .orient('bottom');

  const yAxis = d3.svg.axis()
    .scale(y)
    .orient('left');

  svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0, ${(height + 3)})`)
    .call(xAxis)
  .append('text')
    .attr('x', width)
    .attr('dy', '-.71em')
    .style('text-anchor', 'end')
    .text(xLabel);

  svg.append('g')
    .attr('class', 'axis')
    // .attr('transform', `translate(${margin.left}, 0)`)
    .attr('transform', `translate(${margin.left}, 3)`)
    .call(yAxis)
  .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 6)
    .attr('dy', '.71em')
    .style('text-anchor', 'end')
    .text(yLabel);

  svg
      .on("mousemove", mousemove)
      .on("mouseup", mouseup);

  function redraw() {
    points[pointsAttr] = pointsCoordinates.map(p => [x.invert(p[0]), y.invert(p[1])]);
    svg.select("path").attr("d", line);

    let circle = svg.selectAll("circle")
        .data(pointsCoordinates, function(d) { return d; });

    circle.enter().append("circle")
        .attr("r", 1e-6)
        .on("mousedown", function(d) { selected = dragged = d; redraw(); })
      .transition()
        .duration(750)
        .ease("elastic")
        .attr("r", 5);

    circle
        .classed("selected", function(d) { return d === selected; })
        .attr("cx", function(d) { return d[0]; })
        .attr("cy", function(d) { return d[1]; });

    if (d3.event) {
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
  }

  function mousemove() {
    if (!dragged) return;
    let m = d3.mouse(svg.node());
    // dragged[0] = Math.max(0, Math.min(width, m[0]));
    dragged[1] = Math.max(0, Math.min(height, m[1]));
    redraw();
  }

  function mouseup() {
    if (!dragged) return;
    mousemove();
    dragged = null;
  }
}

$(document).ready(function() {
  makeDrawableGraph('time' ,'#userDrawGraph', 'time', '# max Sales', [0, 16]);
  makeDrawableGraph('rank', '#userDrawGraph2', 'rank', '# max Sales', [-5, 5]);

  setTimeout(() => {
    let reactForm = ReactDOM.render(
      React.createElement(OptionsForm, { onSubmit: fetchAll }),
      document.getElementById("options_form"));
    fetchAll(reactForm.state);
  }, 500);
});
