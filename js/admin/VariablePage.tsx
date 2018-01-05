import * as React from 'react'
import {observer} from 'mobx-react'
import {observable, computed, action, runInAction, reaction, IReactionDisposer} from 'mobx'

import Admin from './Admin'

@observer
export default class VariablePage extends React.Component<{ variableId: number }> {
    context: { admin: Admin }

    render() {
        return <main className="VariablePage">
            hi
        </main>
    }

    async getData() {
        const {variableId} = this.props
        const {admin} = this.context

        const json = admin.getJSON(`variables/${variableId}.json`)
        if (admin.currentRequests.length > 0)
            return
    }

    dispose: IReactionDisposer
    componentDidMount() {
        this.getData()
     }

     componentWillUnmount() {
         this.dispose()
     }
}
