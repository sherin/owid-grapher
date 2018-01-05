import * as React from 'react'
import Admin from './Admin'
import ChartEditorPage from './ChartEditorPage'
import {observable, action} from 'mobx'
import {observer} from 'mobx-react'
import ChartIndexPage from './ChartIndexPage'
import AdminSidebar from './AdminSidebar'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'


@observer
export default class AdminApp extends React.Component<{ admin: Admin }> {
    getChildContext() {
        return { admin: this.props.admin }
    }

    render() {
        const {admin} = this.props

        return <Router basename={admin.basePath}>
            <Switch>
                {/*<Route path="/variables/:variableId" render={({ match }) => <VariablePage variableId={match.params.variableId}/>}/>*/}
                <Route path="/charts/create" component={ChartEditorPage}/>
                <Route path="/charts/:chartId/edit" render={({ match }) => <ChartEditorPage chartId={parseInt(match.params.chartId)}/>}/>
                <Route path="/" component={ChartIndexPage}/>
            </Switch>
        </Router>
    }
}
