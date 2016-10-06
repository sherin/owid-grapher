;(function() {
	"use strict";
	owid.namespace("owid.view.timeline");

	owid.view.timeline = function(chart, containerNode) {
		var timeline = {};

		var state = {
			years: [1900, 1920, 1940, 2000], // Series of selectable years
			startYear: 1960, // Selected start year for range
			endYear: 1980 // Selected end year for range
		};
		timeline.state = state;

		timeline.dispatch = d3.dispatch('change');

		var changes = owid.changes();
		changes.track(state);

		var minYear, maxYear;

		var $container = $(containerNode),
			$el, $sliderWrapper, $slider, $sliderLabel, $sliderInput, $minYear, $maxYear,
			$startYearMarker, $endYearMarker;

		var dragTarget;

		function onMousedown(evt) {
			var $marker = $(evt.target).closest('.timeline-marker');

			if (!$marker.length)
				dragTarget = 'range';
			else if ($marker.is('.start'))
				dragTarget = 'start';
			else if ($marker.is('.end'))
				dragTarget = 'end';	


			$(window).one("mouseup", onMouseup);
			$(window).on("mousemove.timeline", onMousemove);
			onMousemove(evt); // To allow clicking as well as dragging
		}

		function onMouseup(evt) {
			dragTarget = null;
			$(window).off("touchend.timeline");
			$(window).off("mousemove.timeline");
		}

		function onMousemove(evt) {
			var pageX = evt.pageX || evt.originalEvent.touches[0].pageX,
				xPos = pageX - $slider.offset().left*(owid.features.zoom && chart.scale > 1 ? chart.scale : 1),
				fracWidth = xPos / ($slider.width()*chart.scale),
				targetYear = minYear + fracWidth*(maxYear-minYear);

			targetYear = Math.max(minYear, Math.min(maxYear, targetYear));

			if (dragTarget == 'start') {
				if (targetYear > state.endYear)
					state.startYear = state.endYear;
				else
					state.startYear = targetYear;
			} else if (dragTarget == 'end') {
				if (targetYear < state.startYear)
					state.endYear = state.startYear;
				else
					state.endYear = targetYear;
			} else if (dragTarget == 'range') {
				var centerYear = state.startYear + (state.endYear-state.startYear)/2,
					diff = targetYear-centerYear;

				if (state.startYear+diff < minYear)
					diff = minYear-state.startYear;
				if (state.endYear+diff > maxYear)
					diff = maxYear-state.endYear;

				state.startYear += diff;
				state.endYear += diff;
			}

			timeline.dispatch.change();
			timeline.render();
		}

		function initialize() {
			if ($el && $el.length !== 0) return;

			$el = chart.$(".timeline").clone();
			timeline.$el = $el;
			$container.append($el);
			$slider = $el.find(".timeline-slider");
			$sliderLabel = $slider.find(".timeline-slider-label");
			$minYear = $el.find(".timeline-min-year");
			$maxYear = $el.find(".timeline-max-year");

			$startYearMarker = $el.find(".timeline-marker.start");
			$endYearMarker = $el.find(".timeline-marker.end");

			$el.off('mousedown').on('mousedown', onMousedown);
		}

		// Find closest year in configured points to any given year
		function getClosestYear(targetYear) {
            return _.min(state.years, function(year) {
                return Math.abs(year-targetYear);
            });
		}

		timeline.node = function() {
			return $el.get(0);
		};

		timeline.render = function() {
			if (!changes.start()) return;

			initialize();

			if (changes.any('years')) {
				minYear = _.first(state.years);
				maxYear = _.last(state.years);

				$minYear.text(owid.displayYear(minYear));
				$maxYear.text(owid.displayYear(maxYear));

				if (owid.displayYear(minYear).length > 4) 
					$minYear.css('font-size', '10px');
				else
					$minYear.css('font-size', "");

				if (owid.displayYear(maxYear).length > 4) 
					$maxYear.css('font-size', '10px');
				else
					$maxYear.css('font-size', "");
			}
		
			var startYear = getClosestYear(state.startYear), endYear = getClosestYear(state.endYear);

			var startYearFrac = (startYear-minYear)/(maxYear-minYear);	
			$startYearMarker.css('left', 'calc(' + (startYearFrac*100) + '% - 0.5em)');
			var endYearFrac = (endYear-minYear)/(maxYear-minYear);	
			$endYearMarker.css('left', 'calc(' + (endYearFrac*100) + '% - 0.5em)');


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

		onTouchstart: function(evt) {
			this.isDragging = true;
			$(window).one("touchend", this.onMouseup.bind(this));
			$(window).on("touchmove.timeline", this.onMousemove.bind(this));
			this.onMousemove(evt);			
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