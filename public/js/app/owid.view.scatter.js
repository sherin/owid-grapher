;(function(d3) {
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

		var margin, width, height, svg, x, y, xAxis, yAxis;

		function initialize() {
			if (svg) svg.remove();

			margin = {top: state.bounds.top + 20, right: 0, bottom: 30, left: state.bounds.left};
		    width = state.bounds.width - margin.right;
		    height = state.bounds.height - margin.bottom;

			x = d3.scaleLinear().range([0, width]);

			y = d3.scaleLinear().range([height, 0]);


  		    x.domain([
		        d3.min(state.data, function(series) { return d3.min(series.values, function(d) { return d.x; }); }),
		        d3.max(state.data, function(series) { return d3.max(series.values, function(d) { return d.x; }); })
		    ]);

  		    y.domain([
		        d3.min(state.data, function(series) { return d3.min(series.values, function(d) { return d.y; }); }),
		        d3.max(state.data, function(series) { return d3.max(series.values, function(d) { return d.y; }); })
		    ]);

/*			xAxis = d3.svg.axis()
			    .scale(x)
			    .orient("bottom");

			yAxis = d3.svg.axis()
			    .scale(y)
			    .orient("left");*/

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

			svg.append("svg:defs").selectAll("marker")
				.data(["arrowhead"])
		        .enter().append("svg:marker")
		        .attr("id", String)
		        .attr("viewBox", "0 -5 10 10")
		        .attr("refX", 5)
		        .attr("refY", 0)
		        .attr("markerWidth", 4)
		        .attr("markerHeight", 4)
		        .attr("orient", "auto")
		        .append("svg:path")
		        .attr("d", "M0,-5L10,0L0,5");
		}

		scatter.render = function() {
			if (!changes.start()) return;

			if (changes.any('bounds')) initialize();

  		    x.domain([
		        d3.min(state.data, function(series) { return d3.min(series.values, function(d) { return d.x; }); }),
		        d3.max(state.data, function(series) { return d3.max(series.values, function(d) { return d.x; }); })
		    ]);

  		    y.domain([
		        d3.min(state.data, function(series) { return d3.min(series.values, function(d) { return d.y; }); }),
		        d3.max(state.data, function(series) { return d3.max(series.values, function(d) { return d.y; }); })
		    ]);

			svg.selectAll(".entity").remove();

			var line = d3.line()
			    .curve(d3.curveBasisOpen)
			    .x(function(d) { return x(d.x); })
			    .y(function(d) { return y(d.y); });

			var entities = svg.selectAll(".entity")
				.data(state.data)
				.enter().append("g")
					.attr("class", "entity");

			entities.append("path")
				.attr("class", "line")
				.attr("d", function(d) { return line(d.values); })
				.style("fill", "#ffffff")
				.style("stroke", "#000000")
			    .attr("marker-end", "url(#arrowhead)");

			changes.done();
		};

		return scatter;
	};

})(d3v4);