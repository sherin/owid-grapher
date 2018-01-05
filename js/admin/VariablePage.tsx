import * as React from 'react'
import {observer} from 'mobx-react'
import {observable, computed, action, runInAction, reaction, IReactionDisposer} from 'mobx'

import Admin from './Admin'
import Link from './Link'
import VariableChartPreview, {Variable} from './VariableChartPreview'

@observer
export default class VariablePage extends React.Component<{ variableId: number }> {
    context: { admin: Admin }

    @observable variable?: Variable

    render() {
        const {variable} = this
        if (!variable)
            return null

        console.log(variable)

        return <main className="VariablePage">
            <table className="table table-bordered">
                <tr>
                    <th>Name</th>
                    <td>{variable.name}</td>
                </tr>
                <tr>
                    <th>Description</th>
                    <td>{variable.description}</td>
                </tr>
                <tr>
                    <th>Unit</th>
                    <td>{variable.unit}</td>
                </tr>
                <tr>
                    <th>Short Unit</th>
                    <td>{variable.shortUnit}</td>
                </tr>
                <tr>
                    <th>Source</th>
                    <td><Link to={`/sources/${variable.sourceId}`} native>{variable.sourceName}</Link></td>
                </tr>
                <tr>
                    <th>Charts using this variable</th>
                    <td>
                        {variable.charts.map(chart =>
                            <div><Link to={`/charts/${chart.id}/edit`}>{chart.title}</Link></div>
                        )}
                    </td>
                </tr>
            </table>
            <VariableChartPreview variable={variable}/>
        </main>
    }

    async getData() {
        const {variableId} = this.props
        const {admin} = this.context

        const json = await admin.getJSON(`variables/${variableId}.json`)
        this.variable = json.variable
    }

    componentDidMount() {
        this.getData()
     }
}
