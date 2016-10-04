;(function() {
	"use strict";
	owid.namespace("owid.view.timeslider");

	owid.view.timeline = function(chart, containerNode) {
		var timeline = {};

		var config = {
			years: [1900, 1920, 1940, 2000], // Series of selectable years
			startYear: 1920, // Selected start year for range
			endYear: 1940 // Selected end year for range
		};
		timeline.config = config;

		var changes = owid.changes();
		changes.track(config);

		var minYear, maxYear;

		var $container = $(containerNode),
			$el, $sliderWrapper, $slider, $sliderLabel, $sliderInput, $startYear, $endYear;

		function initialize() {
			if ($el && $el.length !== 0) return;

			$el = chart.$(".timeline").clone();
			timeline.$el = $el;
			$container.append($el);
			$sliderWrapper = $el.find(".timeline-wrapper");
			$slider = $el.find(".timeline-slider");
			$sliderLabel = $slider.find(".timeline-slider-label");
			$sliderInput = $sliderWrapper.find("[type='range']");
			$startYear = $el.find(".timeline-start-year");
			$endYear = $el.find(".timeline-end-year");
		}

		timeline.node = function() {
			return $el.get(0);
		};

		timeline.render = function() {
			if (!changes.start()) return;

			initialize();

			if (changes.any('years')) {
				minYear = _.first(config.years);
				maxYear = _.last(config.years);

				$startYear.text(owid.displayYear(minYear));
				$endYear.text(owid.displayYear(maxYear));

				if (owid.displayYear(minYear).length > 4) 
					$startYear.css('font-size', '10px');
				else
					$startYear.css('font-size', "");

				if (owid.displayYear(maxYear).length > 4) 
					$endYear.css('font-size', '10px');
				else
					$endYear.css('font-size', "");
				
				$sliderInput.attr("min", minYear);
				$sliderInput.attr("max", maxYear);				

				if (minYear == maxYear) {
					$sliderInput.prop("disabled", true);
				} else {
					$sliderInput.prop("disabled", false);
				}
			}
			
			changes.done();
		};

		return timeline;
	};
	
	App.Views.Chart.Map.TimelineControl = owid.View.extend({
		el: "#map-chart-tab .map-timeline-controls .timeline-control",
		events: {
			"mousedown": "onMousedown",
			"touchstart": "onTouchstart"
		},

		initialize: function( options ) {
			this.dispatcher = options.dispatcher;
			

			this.listenTo(this.dispatcher, "increment-time", this.onIncrementTime.bind(this));
			this.listenTo(App.MapModel, "change:targetYear", this.onChangeYear.bind(this));
		},

		onMousedown: function(evt) {
			this.isDragging = true;
			$(window).one("mouseup", this.onMouseup.bind(this));
			$(window).on("mousemove.timeline", this.onMousemove.bind(this));
			this.onMousemove(evt);
		},

		onTouchstart: function(evt) {
			this.isDragging = true;
			$(window).one("touchend", this.onMouseup.bind(this));
			$(window).on("touchmove.timeline", this.onMousemove.bind(this));
			this.onMousemove(evt);			
		},

		onMouseup: function() {
			this.isDragging = false;
			$(window).off("touchend.timeline");
			$(window).off("mousemove.timeline");
		},

		onMousemove: function(evt) {
			if (!this.isDragging) return;
			evt.preventDefault();

			var pageX = evt.pageX || evt.originalEvent.touches[0].pageX,
				xPos = pageX - this.$sliderInput.offset().left*(owid.features.zoom && chart.scale > 1 ? chart.scale : 1),
				fracWidth = xPos / (this.$sliderInput.width()*chart.scale),
				targetYear = this.minYear + fracWidth*(this.maxYear-this.minYear);

			this.setTargetYear(targetYear);
		},

		setTargetYear: function(targetYear) {
			// Find the closest year that is a valid selection
			var closestYear = _.min(this.years, function(year) {
				return Math.abs(year-targetYear);
			});

			App.MapModel.set("targetYear", closestYear);			
		},

		render: function() {
			this.createTicks(this.$sliderInput);
		},

		updateSliderInput: function(time) {
			var intTime = parseInt(time, 10),
				min = parseInt( this.$sliderInput.attr( "min" ), 10 ),
				max = parseInt( this.$sliderInput.attr( "max" ), 10 ),
				newPoint = ( intTime - min ) / ( max - min );
			
			this.$sliderLabel.text(owid.displayYear(time));
			this.$slider.css("left", this.$sliderWrapper.width()*newPoint);
			this.$sliderInput.val(intTime);
			if (intTime === min || intTime === max) {
				this.$sliderLabel.hide();
				this.$sliderInput.removeClass( "thumb-label" );
				if( intTime === min ) {
					this.$startYear.addClass( "highlight" );
					this.$endYear.removeClass( "highlight" );
				} else {
					this.$startYear.removeClass( "highlight" );
					this.$endYear.addClass( "highlight" );
				}
			} else {
				this.$sliderLabel.show();
				this.$sliderInput.addClass( "thumb-label" );
				this.$startYear.removeClass( "highlight" );
				this.$endYear.removeClass( "highlight" );
			}
		},

		onChangeYear: function() {
			var targetYear = App.MapModel.get("targetYear");
			this.updateSliderInput(targetYear);

			if (targetYear != parseInt(this.$sliderInput.val()))
				this.$sliderInput.trigger("change");		
		},

		onIncrementTime: function( evt ) {
			var currentYear = parseInt(this.$sliderInput.val()),
				index = this.years.indexOf(currentYear);

			var nextIndex = index+1;
			if (nextIndex >= this.years.length) {
				this.dispatcher.trigger( "max-increment-time" );
				return;				
			}

			var nextYear = this.years[nextIndex];
			this.setTargetYear(nextYear);
		},

/*		createTicks: function( $input ) {
			if( this.$el.find( ".timeline-ticks" ).length ) {
				//this.$el.find(".timeline-ticks").remove();
				//already has ticks, bail
				return;
			}

			var min = this.minYear,
				max = this.maxYear,
				rangeSize = max-min,
				htmlString = "<ol class='timeline-ticks'>";	

			_.each(this.years, function(year, i) {
				var progress = (year-min) / rangeSize,
					percent = progress*100,
					translate = "translate(-" + percent + "%, 0)",
					tickString = "<li style='left:" + percent + "%;-webkit-transform:" + translate + ";-ms-transform:" + translate + ";transform:" + translate + "'>" + year + "</li>";
				htmlString += tickString;
			});

			htmlString += "</ol>";
			$input.after( $( htmlString ) );
		},

		show: function() {
			this.$el.css( "display", "block" );
		},

		hide: function() {
			this.$el.css( "display", "none" );
		}*/

	});
})();