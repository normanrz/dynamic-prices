function draw() {


  d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };

  const max = 20;
  function randomArray(length) {
    return Array.apply(null, Array(length)).map(function(_, i) {
        return Math.random() * max;
    });
  }

  const T = 20;
  let data1 = randomArray(T);
  let data2 = randomArray(T);


  var margin = {top: 20, right: 20, bottom: 30, left: 50},
      width = 700 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

  var x = d3.scale.linear()
      .domain([0, T])
      .range([0, width]);
    
  var y = d3.scale.linear()
      .domain([0, max])
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .ticks(2)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .ticks(2)
      .orient("left");

  var line = d3.svg.line()
      .x(function(d, i) { return x(i); })
      .y(function(d, i) { return y(d); });

  var changeToColor = function(){
    let x = d3.select(this)
      .attr("stroke", "grey")
      .moveToFront();

    $('h1').text(x.attr("N"));
  }
  var changeToGrey = function(){
    d3.select(this).attr("stroke", "whitesmoke");
    $('h1').text("Hello World");
  }


  var svg = d3.select("#graph").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

    svg.append("path")
      .attr("N", "N=1")
      .attr("class", "line")
      .attr("stroke", "whitesmoke")
      .on("mouseover", changeToColor)
      .on("mouseout", changeToGrey)
      .attr("d", line(data1));

    svg.append("path")
      .attr("N", "N=2")
      .attr("class", "line")
      .attr("stroke", "whitesmoke")
      .on("mouseover", changeToColor)
      .on("mouseout", changeToGrey)
      .attr("d", line(data2));


}

$(document).ready(function(){
  draw();
});

