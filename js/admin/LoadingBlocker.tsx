import * as React from 'react'
import { CircularProgress } from 'material-ui/Progress'

export default class LoadingBlocker extends React.Component {
    render() {
        const style: any = {
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            zIndex: 2100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px'
        }
        return <div style={style}>
            <CircularProgress/>
        </div>
    }
}