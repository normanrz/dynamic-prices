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
  constructor(height, T, N, maxPrice, divToDraw) {
    this.data = []
    this.width = divToDraw.node().getBoundingClientRect().width - margin.left - margin.right,
    this.height = height - margin.top - margin.bottom;

    this.x = d3.scale.linear()
      .domain([0, T])
      .range([0, this.width]);
      
    this.y = d3.scale.linear()
      .domain([0, maxPrice])
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
  drawLine(prices) {

  this.svg.append('path')
    .attr('class', 'sim-line')
    .attr('stroke', 'whitesmoke')
    // .on('mouseover', mouseOver)
    // .on('mouseout', mouseOut)
    // .on('mousemove', mouseMove)
    .attr('d', this.line(prices));
  }
}

$(document).ready(function(){
  const T = 100;
  const N = 20;
  const maxPrice = 20;

  function randomArray(length) {
  return Array.apply(null, Array(length)).map(function(_, i) {
    return Math.random() * maxPrice;
  });
}
  fetch('/api/pricing_policy', { 
    method: 'POST', 
    body: JSON.stringify({ T, N }), 
    headers: { 'Content-Type': 'application/json' }
  }).then(res => res.json())
    .then(result => {
      pricingPolicyChart = new PricingPolicyChart(400, T, N, maxPrice, d3.select('#pricingpolicy'));
      result.forEach(row => pricingPolicyChart.drawLine(row.prices, row.n));

      sims = []
      for(let i = 0; i < 12; i++) {
        sims.push(randomArray(T));
      }
      sims.forEach( s => {
        const newDiv = $('<div></div>')
          .addClass('col-md-3')
          .addClass('text-center')
        $('#sim').append(newDiv);

        chart = new SimulationResultChart(200, T, N, maxPrice, d3.select(newDiv.get()[0]))
          .drawLine(s);

        const newB = $('<button></button')
          .text('Details')
          .addClass('btn')
          .addClass('btn-default');

        newDiv.append(newB);

      });


    });
});
