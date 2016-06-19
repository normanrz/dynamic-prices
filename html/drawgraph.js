d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

function initializeLineChart(N, T, maxPrice) {
  data = []
  const margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = $("#pricingpolicy").width() - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  const x = d3.scale.linear()
    .domain([0, T])
    .range([0, width]);
    
  const y = d3.scale.linear()
    .domain([0, maxPrice])
    .range([height, 0]);

  const xAxis = d3.svg.axis()
    .scale(x)
    // .ticks(2)
    .orient("bottom");

  const yAxis = d3.svg.axis()
    .scale(y)
    // .ticks(2)
    .orient("left");

  const line = d3.svg.line()
    .x(function(d, i) { return x(i); })
    .y(function(d, i) { return y(d); });

  const svg = d3.select("#pricingpolicy").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(-1," + (height + 1) + ")")
    .call(xAxis)
  .append("text")
    .attr("x", width - 2 * width/T) // margin to no write on the pricingpolicys
    .attr("dy", "-.71em")
    .style("text-anchor", "end")
    .text("Time");

  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(-1,1)")
    .call(yAxis)
  .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Price");

  const tooltip = d3.select("body").append("div") 
      .attr("class", "tooltip")       
      .style("opacity", 0); 

  function mouseOver() {
    let focusLine = d3.select(this)
      .attr("stroke", "grey")
      .moveToFront();

    $("#selectN div[n='" + focusLine.attr("id") + "'").css("color", "grey");
  }

  function mouseMove(){
    const n = parseInt(d3.select(this).attr("id")) - 1;
    const time = Math.round(x.invert(d3.mouse(this)[0]));
    const price = data[n][time].toFixed(2);

    tooltip.transition()    
        .duration(100)    
        .style("opacity", .9);    
    tooltip.html("" + time + ", "  + price + "")  
        .style("left", (d3.event.pageX) + "px")   
        .style("top", (d3.event.pageY - 20) + "px");        
  }

  function mouseOut(){
    d3.select(this).attr("stroke", "whitesmoke");
    $('#selectN div').css("color", "whitesmoke");
    tooltip.transition()
      .duration(100)
      .style("opacity", 0)
  }

  function drawLine(prices, n) {
    function hoverIn() {
      $(this).css("color", "grey");
      const n = $(this).attr("n");
      const line = d3.select(".line[id='" + n + "']");
      line.moveToFront();
      line.attr("stroke", "grey");
    }

    function hoverOut() {
      $(this).css("color", "whitesmoke");
      const n = $(this).attr("n");
      const line = d3.select(".line[id='" + n + "']");
      line.attr("stroke", "whitesmoke");
    }

    data.push(prices);
    let newDiv = $("<div></div>").text("N=" + n);
    newDiv.hover(hoverIn, hoverOut);
    newDiv.attr("n", n);
    newDiv.css("color", "whitesmoke");
    $("#selectN").append(newDiv);

    svg.append("path")
      .attr("id", n)
      .attr("class", "line")
      .attr("stroke", "whitesmoke")
      .on("mouseover", mouseOver)
      .on("mouseout", mouseOut)
      .on("mousemove", mouseMove)
      .attr("d", line(prices));
    }
}


$(document).ready(function(){
  const T = 100;
  const N = 20;
  const maxPrice = 20;

  fetch("/api/pricing_policy", { 
    method: 'POST', 
    body: JSON.stringify({ T, N }), 
    headers: { "Content-Type": "application/json" }
  }).then(res => res.json())
    .then(result => {

      result.forEach(row => drawLine(row.prices, row.n));
    });

});

