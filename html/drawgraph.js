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

  const T = 100;
  const N = 20;

  fetch("/api/pricing_policy", { 
    method: 'POST', 
    body: JSON.stringify({ T, N }), 
    headers: { "Content-Type": "application/json" }
  }).then(res => res.json())
    .then(result => {

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

      function changeToColor() {
        let x = d3.select(this)
          .attr("stroke", "grey")
          .moveToFront();

        $("#Ns div[n='" + x.attr("id") + "'").css("color", "grey");
      }

      function changeToGrey(){
        d3.select(this).attr("stroke", "whitesmoke");
        $('#Ns div').css("color", "whitesmoke");
      }

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

      function fillInData(data, n) {
        let newDiv = $("<div></div>").text("n=" + n);
        newDiv.hover(hoverIn, hoverOut);
        newDiv.attr("n", n);
        newDiv.css("color", "whitesmoke");
        $("#Ns").append(newDiv);

        svg.append("path")
          .attr("id", n)
          .attr("class", "line")
          .attr("stroke", "whitesmoke")
          .on("mouseover", changeToColor)
          .on("mouseout", changeToGrey)
          .attr("d", line(data));
      }

      result.forEach(row => fillInData(row.prices, row.n));
    });
}

$(document).ready(function(){
  draw();
});

