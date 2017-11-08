import * as React from 'react'
import { observable, computed, action } from 'mobx'
import { observer } from 'mobx-react'
import DimensionWithData from '../charts/DimensionWithData'
import ChartEditor from './ChartEditor'
import { TextField, NumberField, Toggle } from './Forms'
import { toString } from '../charts/Util'
import Card, { CardActions, CardContent } from 'material-ui/Card';
import Grid from 'material-ui/Grid';

@observer
export default class DimensionCard extends React.Component<{ dimension: DimensionWithData, editor: ChartEditor, onEdit?: () => void, onRemove?: () => void }> {
    @observable.ref isExpanded: boolean = true

    @computed get hasExpandedOptions(): boolean {
        return this.props.dimension.property === 'y' || this.props.dimension.property === 'x'
    }

    @action.bound onToggleExpand() {
        this.isExpanded = !this.isExpanded
    }

    @action.bound onIsProjection(value: boolean) {
        this.props.dimension.props.isProjection = value || undefined
    }

    @action.bound onDisplayName(value: string) {
        this.props.dimension.props.displayName = value
    }

    @action.bound onUnit(value: string) {
        this.props.dimension.props.unit = value
    }

    @action.bound onShortUnit(value: string) {
        this.props.dimension.props.shortUnit = value
    }

    @action.bound onTolerance(value: number | undefined) {
        this.props.dimension.props.tolerance = value
    }

    @action.bound onConversionFactor(value: number | undefined) {
        this.props.dimension.props.conversionFactor = value
    }

    @action.bound onSaveToVariable(value: boolean) {
        this.props.dimension.props.saveToVariable = value || undefined
    }

    render() {
        const { dimension, editor } = this.props
        const { chart } = editor

        return <Card className="DimensionCard">
            <header>
                <div>
                    {this.props.onEdit && <span className="clickable" onClick={this.props.onEdit} style={{ 'margin-right': '10px' }}><i className="fa fa-exchange" /></span>}
                    {this.props.onRemove && <span className="clickable" onClick={this.props.onRemove} style={{ 'margin-right': '10px' }}><i className="fa fa-times" /></span>}
                </div>
                <div>{dimension.variable.name}</div>
                <div>
                    {this.hasExpandedOptions && <span className="clickable" onClick={this.onToggleExpand}><i className={"fa fa-chevron-" + (this.isExpanded ? 'up' : 'down')} /></span>}
                </div>
            </header>
            {this.isExpanded && <div>
                <Grid container spacing={16}>
                    <Grid item xs={8}><TextField label="Display name" value={dimension.displayName} onValue={this.onDisplayName} /></Grid>
                    <Grid item xs={4}><Toggle value={dimension.props.displayName !== undefined} onValue={v => dimension.props.displayName = v ? dimension.displayName : undefined}/></Grid>
                    <Grid item xs={8}><TextField label="Unit of measurement" value={dimension.unit} onValue={this.onUnit} helpText={`Original database unit: ${dimension.variable.unit}`}/></Grid>
                    <Grid item xs={4}><Toggle value={dimension.props.unit !== undefined} onValue={v => dimension.props.unit = v ? dimension.unit : undefined}/></Grid>
                    <Grid item xs={8}><TextField label="Short (axis) unit" value={dimension.shortUnit} onValue={this.onShortUnit}/></Grid>
                    <Grid item xs={4}><Toggle value={dimension.props.shortUnit !== undefined} onValue={v => dimension.props.shortUnit = v ? dimension.shortUnit : undefined}/></Grid>
                    <Grid item xs={8}><NumberField label="Unit conversion factor" value={dimension.unitConversionFactor} onValue={this.onConversionFactor}/></Grid>
                    <Grid item xs={4}><Toggle value={dimension.props.conversionFactor !== undefined} onValue={v => dimension.props.conversionFactor = v ? dimension.unitConversionFactor : undefined}/></Grid>
                </Grid>

                {(chart.isScatter || chart.isDiscreteBar) && <NumberField label="Tolerance" value={dimension.props.tolerance} onValue={this.onTolerance} placeholder={toString(dimension.tolerance)} />}
                {chart.isLineChart && <Toggle label="Is projection" value={dimension.isProjection} onValue={this.onIsProjection} />}
                <hr />
                <Toggle label="Use these settings as defaults for future charts" value={!!dimension.props.saveToVariable} onValue={this.onSaveToVariable} />
            </div>}
        </Card>
    }
}
