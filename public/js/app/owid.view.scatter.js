;(function() {
	"use strict";
	owid.namespace("owid.view.scatter");

	owid.view.scatter = function() {
		var scatter = {};

		var state = {
			data: [],
			bounds: {}
		};
		scatter.state = state;
		var changes = owid.changes();
		changes.track(state);

		var margin, width, height, svg, x, y, color, xAxis, yAxis;

		function initialize() {
			if (svg) svg.remove();

			margin = {top: state.bounds.top + 20, right: 0, bottom: 30, left: state.bounds.left};
		    width = state.bounds.width - margin.right;
		    height = state.bounds.height - margin.bottom;

			x = d3.scale.linear()
			    .range([0, width]);

			y = d3.scale.linear()
			    .range([height, 0]);


			x.domain(d3.extent(state.data, function(d) { return d.values[0].x; })).nice();
			y.domain(d3.extent(state.data, function(d) { return d.values[0].y; })).nice();

			color = d3.scale.category10();

			xAxis = d3.svg.axis()
			    .scale(x)
			    .orient("bottom");

			yAxis = d3.svg.axis()
			    .scale(y)
			    .orient("left");

			svg = d3.select("svg")
			  .append("g")
			    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			/*svg.append("g")
			  .attr("class", "x axis")
			  .attr("transform", "translate(0," + height + ")")
			  .call(xAxis)
			.append("text")
			  .attr("class", "label")
			  .attr("x", width)
			  .attr("y", -6)
			  .style("text-anchor", "end");
			  //.text("Sepal Width (cm)");

			svg.append("g")
			  .attr("class", "y axis")
			  .call(yAxis)
			.append("text")
			  .attr("class", "label")
			  .attr("transform", "rotate(-90)")
			  .attr("y", 6)
			  .attr("dy", ".71em")
			  .style("text-anchor", "end");*/
			  //.text("Sepal Length (cm)");
		}

		scatter.render = function() {
			if (!changes.start()) return;

			if (changes.any('bounds')) initialize();

			x.domain(d3.extent(state.data, function(d) { return d.values[0].x; })).nice();
			y.domain(d3.extent(state.data, function(d) { return d.values[0].y; })).nice();

			console.log(state.data.length);

			var dots = svg.selectAll(".dot")
			  .data(state.data);

			dots.transition()
			  .duration(500)
			  .attr("cx", function(d) { return x(d.values[0].x); })
	   	      .attr("cy", function(d) { return y(d.values[0].y); })
	   	      .attr("r", function(d) { return Math.random()*10; })
	   	      .attr("fill", function(d) { return d3.rgb(Math.random()*255, Math.random()*255, Math.random()*255); });

			dots.enter().append("circle")
			    .attr("class", "dot")
			    .attr("r", 3.5)
			  .attr("cx", function(d) { return x(d.values[0].x); })
			    .attr("cy", function(d) { return y(d.values[0].y); });

			dots.exit().remove();


/*            svg.select(".x.axis")
                .transition()
                .duration(1000)
                .call(xAxis);

			svg.select(".y.axis")
			    .transition()
			    .duration(1000)
			    .call(yAxis);*/

			changes.done();
		};

		return scatter;
	};

})();