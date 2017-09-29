import * as React from 'react'
import {computed} from 'mobx'
import {observer} from 'mobx-react'
import Bounds from './Bounds'
import ChartConfig from './ChartConfig'
import LabelledSlopes from './LabelledSlopes'
import NoData from './NoData'
import Header from './Header'
import SourcesFooter from './SourcesFooter'

@observer
export default class SlopeChart extends React.Component<{ bounds: Bounds, chart: ChartConfig }> {
	@computed get transform() {
		return this.props.chart.slopeChart
	}

    @computed get header() {
        const that = this
        return new Header({
            get chart() { return that.props.chart },
            get maxWidth() { return that.props.bounds.width },
        })
    }

    @computed get footer() {
        const that = this
        return new SourcesFooter({
            get chart() { return that.props.chart },
            get maxWidth() { return that.props.bounds.width }
        })
    }

    @computed get innerBounds() { return this.props.bounds.padTop(this.header.height+20).padBottom(this.footer.height+15).padRight(10)}

	render() {
        if (this.transform.failMessage)
            return <NoData bounds={this.props.bounds} message={this.transform.failMessage}/>

		const {bounds, chart} = this.props
		const {header, footer, innerBounds} = this
		const {yAxis} = chart
		const {data} = this.transform

		return <g className="SlopeChart">
            {header.render(bounds.x, bounds.y)}

			<LabelledSlopes bounds={innerBounds} yDomain={yAxis.domain} yTickFormat={yAxis.tickFormat} yScaleType={yAxis.scaleType} yScaleTypeOptions={yAxis.scaleTypeOptions} onScaleTypeChange={(scaleType) => { chart.yAxis.scaleType = scaleType }} data={data}/>

            {footer.render(bounds.x, bounds.bottom-footer.height)}
		</g>
	}
}
