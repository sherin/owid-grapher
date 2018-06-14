import { computed } from 'mobx'
import { scaleOrdinal } from 'd3-scale'
import { includes, identity, extend, some, isEmpty, cloneDeep, find, sortBy, sortedUniq, min, max, values, defaultTo, findClosest, formatYear } from './Util'
import ChartConfig from './ChartConfig'
import { StackedBarValue, StackedBarSeries } from './StackedBarChart'
import AxisSpec from './AxisSpec'
import IChartTransform from './IChartTransform'
import DimensionWithData from './DimensionWithData'
import ColorSchemes, { ColorScheme } from './ColorSchemes'
import DataKey from './DataKey'

// Responsible for translating chart configuration into the form
// of a discrete bar chart
export default class StackedBarTransform implements IChartTransform {
    chart: ChartConfig

    constructor(chart: ChartConfig) {
        this.chart = chart
    }

    @computed get isValidConfig(): boolean {
        return some(this.chart.dimensions, d => d.property === 'y')
    }

    @computed get failMessage(): string | undefined {
        const { filledDimensions } = this.chart.data
        if (!some(filledDimensions, d => d.property === 'y'))
            return "Missing variable"
        else if (this.groupedData.length === 0 || this.groupedData[0].values.length === 0)
            return "No matching data"
        else
            return undefined
    }

    @computed get primaryDimension(): DimensionWithData | undefined {
        return find(this.chart.data.filledDimensions, d => d.property === "y")
    }

    @computed get targetYear(): number {
        const maxYear = this.chart.timeDomain[1]
        if (!this.primaryDimension) return 1900

        const { variable } = this.primaryDimension
        if (maxYear !== undefined)
            return sortBy(variable.yearsUniq, year => Math.abs(year - maxYear))[0]
        else
            return max(variable.yearsUniq) as number

    }

    @computed get timelineYears(): number[] {
        const years = this.primaryDimension.yearsUniq

        // TODO find a better way to space out the bars
        const spacingInYears = 10
        let filteredYears = []

        for (let i = 0; i < years.length; i += spacingInYears) {
            filteredYears.push(years[i])
        }
        return filteredYears
    }

    @computed get minTimelineYear(): number {
        return defaultTo(min(this.timelineYears), 1900)
    }

    @computed get maxTimelineYear(): number {
        return defaultTo(max(this.timelineYears), 2000)
    }


    @computed get startYear(): number {
        const minYear = defaultTo(this.chart.timeDomain[0], this.minTimelineYear)
        return defaultTo(findClosest(this.timelineYears, minYear), this.minTimelineYear)
    }

    @computed get endYear(): number {
        const maxYear = defaultTo(this.chart.timeDomain[1], this.maxTimelineYear)
        return defaultTo(findClosest(this.timelineYears, maxYear), this.maxTimelineYear)
    }

    @computed get barValueFormat(): (datum: StackedBarValue) => string {
        const { primaryDimension, targetYear } = this

        return (datum: StackedBarValue) => {
            return datum.y.toString()
        }
    }

    @computed get tickFormat(): (d: number) => string {
        const {primaryDimension} = this
        return primaryDimension ? primaryDimension.formatValueShort : (d: number) => `${d}`
    }

    // TODO ?
    @computed get colorScheme() {
        const colorScheme = ColorSchemes[this.chart.props.baseColorScheme as string]
        return colorScheme !== undefined ? colorScheme : ColorSchemes["stackedAreaDefault"] as ColorScheme
    }

    @computed get allStackedValues(): StackedBarValue[] {
        const allValues: StackedBarValue[] = []
        this.stackedData.forEach(series => allValues.push(...series.values))
        return allValues
    }

    @computed get xDomainDefault(): [number, number] {
        return [this.startYear, this.endYear]
    }

    @computed get xAxis(): AxisSpec {
        const { chart, xDomainDefault } = this
        return extend(
            chart.xAxis.toSpec({ defaultDomain: xDomainDefault }),
            { tickFormat: (year: number) => formatYear(year),
              hideFractionalTicks: true,
              hideGridlines: true }
        ) as AxisSpec
    }

    @computed get yDomainDefault(): [number, number] {
        const lastSeries = this.stackedData[this.stackedData.length - 1]

        const yValues = lastSeries.values.map(d => d.yOffset + d.y)
        return [
            0,
            defaultTo(max(yValues), 100)
        ]
    }

    @computed get yDimensionFirst() {
        return find(this.chart.data.filledDimensions, d => d.property === 'y')
    }

    @computed get yAxis(): AxisSpec {
        const { chart, yDomainDefault, yDimensionFirst } = this
        const tickFormat = yDimensionFirst ? yDimensionFirst.formatValueShort : identity

        return extend(
            chart.yAxis.toSpec({ defaultDomain: yDomainDefault }),
            {
                domain: [yDomainDefault[0], yDomainDefault[1]], // Stacked chart must have its own y domain
                tickFormat: tickFormat
            }
        ) as AxisSpec
    }

    // Apply time filtering and stacking
    @computed get stackedData(): StackedBarSeries[] {
        const { groupedData, startYear, endYear } = this

        const stackedData = cloneDeep(groupedData)

        for (const series of stackedData) {
            series.values = series.values.filter(v => v.x >= startYear && v.x <= endYear)
        }

        // every subsequent series needs be stacked on top of previous series
        for (let i = 1; i < stackedData.length; i++) {
            for (let j = 0; j < stackedData[0].values.length; j++) {
                stackedData[i].values[j].yOffset = stackedData[i - 1].values[j].y + stackedData[i-1].values[j].yOffset
            }
        }

        return stackedData
    }

    @computed get groupedData(): StackedBarSeries[] {
        const { chart, timelineYears } = this
        const { filledDimensions, selectedKeys, selectedKeysByKey } = chart.data

        let groupedData: StackedBarSeries[] = []

        filledDimensions.forEach((dimension, dimIndex) => {
            const seriesByKey = new Map<DataKey, StackedBarSeries>()

            for (let i=0; i <= dimension.years.length; i += 1) {
                const year = dimension.years[i]
                const entity = dimension.entities[i]
                const value = +dimension.values[i]
                const datakey = chart.data.keyFor(entity, dimIndex)
                let series = seriesByKey.get(datakey)

                // Not a selected key, don't add any data for it
                if (!selectedKeysByKey[datakey]) continue
                // Must be numeric
                if (isNaN(value)) continue
                // Stacked bar chart can't go negative!
                if (value < 0) continue
                // only consider years that are part of timeline to line up the bars
                if (!includes(timelineYears, year)) continue

                if (!series) {
                    series = {
                        key: datakey,
                        values: [],
                        color: "#fff" // temp
                    }
                    seriesByKey.set(datakey, series)
                }
                series.values.push({ x: year, y: value, yOffset: 0, isFake: false })
            }

            groupedData = groupedData.concat([...Array.from(seriesByKey.values())])
        })

        // Now ensure that every series has a value entry for every year in the data
        groupedData.forEach(series => {
            let i = 0

            while (i < timelineYears.length) {
                const value = series.values[i] as StackedBarValue|undefined
                const expectedYear = timelineYears[i]

                if (value === undefined || value.x > timelineYears[i]) {
                    let fakeY = 0
                    series.values.splice(i, 0, { x: expectedYear, y: fakeY, yOffset: 0, isFake: true })
                }
                i += 1
            }
        })

        // Assign colors
        const baseColors = this.colorScheme.getColors(groupedData.length)
        if (chart.props.invertColorScheme)
            baseColors.reverse()
        const colorScale = scaleOrdinal(baseColors)
        groupedData.forEach(series => {
            series.color = chart.data.keyColors[series.key] || colorScale(series.key)
        })

        return groupedData;
    }
}
