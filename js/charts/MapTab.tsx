import * as React from 'react'
import Bounds from './Bounds'
import {observable, computed, action} from 'mobx'
import {observer} from 'mobx-react'
import ChoroplethMap, {ChoroplethData, GeoFeature, MapBracket, MapEntity} from './ChoroplethMap'
import MapLegend, {MapLegendView} from './MapLegend'
import {getRelativeMouse} from './Util'
import Header from './Header'
import SourcesFooter from './SourcesFooter'
import ChartConfig from './ChartConfig'
import MapConfig from './MapConfig'
import {MapLegendBin} from './MapData'
import MapProjection from './MapProjection'
import ChartView from './ChartView'
import Tooltip from './Tooltip'
import NoData from './NoData'
import {select} from 'd3-selection'
import {easeCubic} from 'd3-ease'
import ControlsFooter from './ControlsFooter'
import HTMLTimeline from './HTMLTimeline'

interface TimelineMapProps {
    bounds: Bounds,
    choroplethData: ChoroplethData,
    years: number[],
    inputYear: number,
    legendData: MapLegendBin[],
    legendTitle: string,
    projection: MapProjection,
    defaultFill: string
}

@observer
class TimelineMap extends React.Component<TimelineMapProps> {
    @observable focusEntity: any = null
    @observable.ref tooltip: React.ReactNode|null = null

    context: { chartView: ChartView, chart: ChartConfig }

    base: SVGGElement
    @action.bound onMapMouseOver(d: GeoFeature, ev: React.MouseEvent<SVGPathElement>) {
        const datum = d.id == undefined ? undefined : this.props.choroplethData[d.id]
        this.focusEntity = { id: d.id, datum: datum || { value: "No data" } }
        const {chart} = this.context
        
        const mouse = getRelativeMouse(this.base, ev)
        if (datum) {
            this.tooltip = <Tooltip x={mouse.x} y={mouse.y} style={{textAlign: "center"}}>
                <h3 style={{padding: "0.3em 0.9em", margin: 0, backgroundColor: "#fcfcfc", borderBottom: "1px solid #ebebeb", fontWeight: "normal", fontSize: "1em"}}>{datum.entity}</h3>
                <p style={{margin: 0, padding: "0.3em 0.9em", fontSize: "0.8em"}}>
                    <span>{chart.map.data.formatTooltipValue(datum.value)}</span><br/>
                    in<br/>
                    <span>{datum.year}</span>
                </p>
            </Tooltip>
        }
    }

    @action.bound onMapMouseLeave() {
        this.focusEntity = null
        this.tooltip = null
    }

    @action.bound onClick(d: GeoFeature) {
        const {chartView, chart} = this.context

        if (chartView.isMobile || !chart.hasChartTab || !d.id) return;
        const entity = this.props.choroplethData[d.id].entity
        
        chart.tab = 'chart'
        chart.data.selectedKeys = chart.data.availableKeysByEntity.get(entity)||[]
    }

    componentWillUnmount() {
        this.onMapMouseLeave()
        this.onLegendMouseLeave()
    }

    @observable focusBracket: MapBracket
    @action.bound onLegendMouseOver(d: MapEntity) {
        this.focusBracket = d
    }

    @action.bound onLegendMouseLeave() {
        this.focusBracket = null
    }


    @computed get hasTimeline(): boolean {
        return this.props.years.length > 1 && !this.context.chartView.isExport
    }

    @computed get mapLegend(): MapLegend {
        const that = this
        return new MapLegend({
            get bounds() { return that.props.bounds },
            get legendData() { return that.props.legendData },
            get title() { return that.props.legendTitle },
            get focusBracket() { return that.focusBracket },
            get focusEntity() { return that.focusEntity }
        })
    }

    componentDidMount() {
        select(this.base).selectAll("path")
            .attr("data-fill", function() { return (this as SVGPathElement).getAttribute("fill")})
            .attr("fill", this.context.chart.map.noDataColor)
            .transition()
                .duration(500)
                .ease(easeCubic)
                .attr("fill", function() { return (this as SVGPathElement).getAttribute("data-fill") })
                .attr("data-fill", function() { return (this as SVGPathElement).getAttribute("fill") })
    }

    render() {
        const { choroplethData, projection, defaultFill } = this.props
        let { bounds } = this.props
        const {focusBracket, focusEntity, mapLegend, tooltip} = this
        return <g className="mapTab">
            {/*<rect x={bounds.left} y={bounds.top} width={bounds.width} height={bounds.height-timelineHeight} fill="#ecf6fc"/>*/}
            <ChoroplethMap bounds={bounds.padBottom(mapLegend.height+15)} choroplethData={choroplethData} projection={projection} defaultFill={defaultFill} onHover={this.onMapMouseOver} onHoverStop={this.onMapMouseLeave} onClick={this.onClick} focusBracket={focusBracket} focusEntity={focusEntity}/>
            <MapLegendView legend={mapLegend} onMouseOver={this.onLegendMouseOver} onMouseLeave={this.onLegendMouseLeave}/>
            {/*hasTimeline && <Timeline bounds={this.props.bounds.fromBottom(timelineHeight)} onTargetChange={this.onTargetChange} years={years} startYear={inputYear} endYear={inputYear} singleYearMode={true}/>*/}
            {tooltip}
        </g>
    }
}

interface MapTabProps {
    chart: ChartConfig,
    bounds: Bounds
}

@observer
export default class MapTab extends React.Component<MapTabProps> {
    @computed get map(): MapConfig { return (this.props.chart.map as MapConfig) }

    @computed get svgBounds() {
        return this.props.bounds.padBottom(this.controlsFooterHeight)
    }

    @computed get svgPaddedBounds() {
        return new Bounds(0, 0, this.svgBounds.width, this.svgBounds.height).pad(15)
    }

    @computed get header() {
        const _this = this
        return new Header({
            get chart() { return _this.props.chart },
            get maxWidth() { return _this.svgPaddedBounds.width },
            get minYear() { return _this.map.data.targetYear },
            get maxYear() { return _this.map.data.targetYear }
        })
    }

    @computed get footer() {
        const _this = this
        return new SourcesFooter({
            get chart() { return _this.props.chart },
            get maxWidth() { return _this.svgPaddedBounds.width }
        })
    }

    @observable.ref controlsFooterHeight: number = 0

    @computed get innerBounds() {
        return this.svgPaddedBounds.padTop(this.header.height+20).padBottom(this.footer.height+15)
    }

    renderSVG() {
        const {map, header, footer, svgBounds, svgPaddedBounds, innerBounds} = this

        const svgStyle = {
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: Bounds.baseFontSize,
            backgroundColor: "white"
        }

        return <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={svgStyle} width={svgBounds.width} height={svgBounds.height}>
            {header.render(svgPaddedBounds.x, svgPaddedBounds.y)}
            {!map.data.isReady && <NoData bounds={this.props.bounds}/>}
            {map.data.isReady && <TimelineMap
                bounds={innerBounds}
                choroplethData={map.data.choroplethData}
                years={map.data.years}
                inputYear={map.data.targetYear}
                legendData={map.data.legendData}
                legendTitle={map.data.legendTitle}
                projection={map.projection}
                defaultFill={map.noDataColor}
            />}
            {footer.render(svgPaddedBounds.x, svgPaddedBounds.bottom-footer.height)}
        </svg>
    }

    base: HTMLDivElement
    componentDidMount() {
        this.componentDidUpdate()
    }
    componentDidUpdate() {
        const controlsFooter = this.base.querySelector(".ControlsFooter")
        if (controlsFooter)
            this.controlsFooterHeight = controlsFooter.getBoundingClientRect().height
    }

    @action.bound onTargetChange({targetStartYear}: {targetStartYear: number}) {
        this.props.chart.map.targetYear = targetStartYear
    }

    render() {
        const {chart} = this.props
        const {map} = this

        return <div className="MapTab">
            {this.renderSVG()}
            <ControlsFooter chart={chart}>
                <HTMLTimeline onTargetChange={this.onTargetChange} years={map.data.years} startYear={map.data.targetYear} endYear={map.data.targetYear} singleYearMode={true}/>
            </ControlsFooter>
            {chart.tooltip}
        </div>
    }
}