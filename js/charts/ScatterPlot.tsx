/* ScatterPlot.jsx
 * ================
 *
 * Entry point for scatter charts
 *
 * @project Our World In Data
 * @author  Jaiden Mispy
 * @created 2017-03-09
 */

import * as _ from 'lodash'
import * as d3 from 'd3'
import owid from '../owid'
import * as React from 'react'
import {observable, computed, action, autorun} from 'mobx'
import {observer} from 'mobx-react'
import Bounds from './Bounds'
import ChartConfig from './ChartConfig'
import NoData from './NoData'
import Axis from './Axis'
import AxisScale from './AxisScale'
import Layout from './Layout'
import Timeline from './Timeline'
import PointsWithLabels from './PointsWithLabels'
import {preInstantiate} from './Util'

type ScatterSeries = any

interface ScatterWithAxisProps {
    bounds: Bounds,
    data: ScatterSeries[],
    xScale: AxisScale,
    yScale: AxisScale,
    xAxisLabel: string,
    yAxisLabel: string
}

@observer
class ScatterWithAxis extends React.Component<any, null> {
    render() {
        const {bounds, xScale, yScale, xAxisLabel, yAxisLabel, data} = this.props

        const xAxisBounds = Axis.calculateBounds(bounds, { orient: 'bottom', scale: xScale, label: xAxisLabel })
        const yAxisBounds = Axis.calculateBounds(bounds, { orient: 'left', scale: yScale, label: yAxisLabel })
        const innerBounds = bounds.padBottom(xAxisBounds.height).padLeft(yAxisBounds.width)

        return <g>
            <Axis orient="left" scale={yScale} labelText={yAxisLabel} bounds={bounds.padBottom(xAxisBounds.height)}/>
            <Axis orient="bottom" scale={xScale} labelText={xAxisLabel} bounds={bounds.padLeft(yAxisBounds.width)}/>
            <PointsWithLabels {...this.props} xScale={xScale} yScale={yScale} data={data} bounds={innerBounds}/>
        </g>
    }
}

@observer
export default class ScatterPlot extends React.Component<{ bounds: Bounds, config: ChartConfig }, null> {
    @computed get chart() : ChartConfig {
        return this.props.config
    }

    @computed get bounds() : Bounds {
        return this.props.bounds
    }

    @computed get colorScheme() : string[] {
        return [ // TODO less ad hoc color scheme (probably would have to annotate the datasets)
            "#5675c1", // Africa
            "#aec7e8", // Antarctica
            "#d14e5b", // Asia
            "#ffd336", // Europe
            "#4d824b", // North America
            "#a652ba", // Oceania
            "#69c487", // South America
            "#ff7f0e", "#1f77b4", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "c49c94", "e377c2", "f7b6d2", "7f7f7f", "c7c7c7", "bcbd22", "dbdb8d", "17becf", "9edae5", "1f77b4"]
    }

    @computed get dimensions() : Object[] {
        return this.chart.dimensions
    }

    @computed get colorScale() {
        const {colorScheme, dimensions} = this

        const colorScale = d3.scaleOrdinal().range(this.colorScheme)

        var colorDim = _.find(dimensions, { property: 'color' });
        if (colorDim) {
            colorScale.domain(colorDim.variable.categoricalValues);
        }

        return colorScale
    }

    @computed get timelineYears() {
        return this.yearsWithData
    }

    @computed get configTolerance() {
        return 1
    }

    // Precompute the data transformation for every timeline year (so later animation is fast)
    @computed get dataByEntityAndYear() {
        const {timelineYears, dimensions, configTolerance, colorScale} = this
        var dataByEntityAndYear = {};

        // The data values
        _.each(dimensions, function(dimension) {
            var variable = dimension.variable,
                tolerance = (dimension.property == 'color' || dimension.property == 'size') ? Infinity : configTolerance;

            var targetYears = timelineYears;

            _.each(timelineYears, function(targetYear) {
                for (var i = 0; i < variable.years.length; i++) {
                    var year = variable.years[i],
                        value = variable.values[i],
                        entity = variable.entityKey[variable.entities[i]];

                    // Skip years that aren't within tolerance of the target
                    if (year < targetYear-tolerance || year > targetYear+tolerance)
                        continue;

                    var dataByYear = owid.default(dataByEntityAndYear, entity.id, {}),
                        series = owid.default(dataByYear, targetYear, {
                            id: entity.id,
                            label: entity.name,
                            key: entity.name,
                            values: [{ time: {} }]
                        });

                    var d = series.values[0];

                    // Ensure we use the closest year to the target
                    var currentYear = d.time[dimension.property];
                    if (_.isFinite(currentYear) && Math.abs(currentYear-targetYear) < Math.abs(year-targetYear))
                        continue;

                    if (dimension.property == 'color')
                        series.color = colorScale(value);
                    else {
                        d.time[dimension.property] = year;
                        d[dimension.property] = value;
                    }
                }
            });
        });

        // Exclude any with data for only one axis
        _.each(dataByEntityAndYear, function(v, k) {
            var newDataByYear = {};
            _.each(v, function(series, year) {
                var datum = series.values[0];
                if (_.has(datum, 'x') && _.has(datum, 'y'))
                    newDataByYear[year] = series;
            });
            dataByEntityAndYear[k] = newDataByYear;
        });

        return dataByEntityAndYear;
    }

    @computed get currentData() : ScatterSeries[] {
        const {dataByEntityAndYear, startYear, endYear, isInterpolating} = this
        var currentData = [];

        _.each(dataByEntityAndYear, (dataByYear) => {
            /*if (!isInterpolating) {
                if (dataByYear[timeline.targetYear])
                    currentData.push(dataByYear[timeline.targetYear]);
                return;
            }*/

            let series = null
            _.each(dataByYear, (seriesForYear, year) => {
                if (year < startYear || year > endYear)
                    return

                series = series || _.extend({}, seriesForYear, { values: [] })
                series.values = series.values.concat(seriesForYear.values)
            })
            if (series && series.values.length)
                currentData.push(series)
        });

        return currentData;
    }


    @computed get axisDimensions() : Object[] {
        return _.filter(this.dimensions, function(d) { return d.property == 'x' || d.property == 'y'; });
    }

    @computed get yearsWithData() : number[] {
        const {axisDimensions} = this
        const tolerance = 0 // FIXME

        var yearSets = [];

        var minYear = _.min(_.map(axisDimensions, function(d) {
            return _.first(d.variable.years);
        }));

        var maxYear = _.max(_.map(axisDimensions, function(d) {
            return _.last(d.variable.years);
        }));

        _.each(axisDimensions, function(dimension) {
            var variable = dimension.variable,
                yearsForVariable = {};

            _.each(_.uniq(variable.years), function(year) {
                for (var i = Math.max(minYear, year-tolerance); i <= Math.min(maxYear, year+tolerance); i++) {
                    yearsForVariable[i] = true;
                }
            });

            yearSets.push(_.map(_.keys(yearsForVariable), function(year) { return parseInt(year); }));
        });

        return _.sortBy(_.intersection.apply(_, yearSets));
    }

    componentWillMount() {
        console.log(this.chart.timeRange)
        if (!_.isNumber(this.chart.timeRange[0]) || !_.isNumber(this.chart.timeRange[1]))
            this.chart.timeRange = [this.yearsWithData[0], _.last(this.yearsWithData)]
    }

    @action.bound onTimelineChange({startYear, endYear, targetStartYear, targetEndYear}) {
        this.chart.timeRange = [targetStartYear, targetEndYear]
    }

    @computed get startYear() {
        return this.chart.timeRange[0]
    }

    @computed get endYear() {
        return this.chart.timeRange[1]
    }

    @computed get allValues() : Object[] {
        const {dataByEntityAndYear} = this
        return _.flatten(
                  _.map(dataByEntityAndYear, dataByYear =>
                      _.flatten(
                          _.map(dataByYear, series => series.values)
                      )
                  )
               )
    }

    // domains across the entire timeline
    @computed get xDomainDefault() : [number, number] {
        return d3.extent(_.map(this.allValues, 'x'))
    }

    @computed get xDomain() : [number, number] {
        return [
            _.defaultTo(this.chart.xDomain[0], this.xDomainDefault[0]),
            _.defaultTo(this.chart.xDomain[1], this.xDomainDefault[1])
        ]
    }

    @computed get yDomainDefault() : [number, number] {
        return d3.extent(_.map(this.allValues, 'y'))
    }

    @computed get yDomain() : [number, number] {
        return [
            _.defaultTo(this.chart.yDomain[0], this.yDomainDefault[0]),
            _.defaultTo(this.chart.yDomain[1], this.yDomainDefault[1])
        ]
    }

    @computed get xScale() : AxisScale {
        const {xDomain, chart} = this
        return new AxisScale({ scaleType: 'linear', domain: xDomain, tickFormat: chart.xTickFormat })
    }

    @computed get yScale() : AxisScale {
        const {yDomain, chart} = this
        return new AxisScale({ scaleType: 'linear', domain: yDomain, tickFormat: chart.yTickFormat })
    }

    @action.bound onSelectEntity(focusKeys) {
        this.chart.selectedEntities = focusKeys
    }

    @computed get timeline() {
        const {bounds, yearsWithData, startYear, endYear, onTimelineChange} = this
        return preInstantiate(
            <Timeline bounds={bounds.fromBottom(35)} onChange={onTimelineChange} years={yearsWithData} startYear={startYear} endYear={endYear}/>
        )
    }

    render() {
        const {currentData, bounds, yearsWithData, startYear, endYear, xScale, yScale, chart, timeline} = this
        return <g>
            <ScatterWithAxis data={currentData} bounds={this.bounds.padBottom(timeline.height)} xScale={xScale} yScale={yScale} xAxisLabel={chart.xAxisLabel} yAxisLabel={chart.yAxisLabel} onSelectEntity={this.onSelectEntity} focusKeys={this.chart.selectedEntities}/>
            <Timeline {...timeline.props}/>
        </g>
    }
}