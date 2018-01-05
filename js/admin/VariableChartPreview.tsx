import * as React from 'react'

export interface Variable {
    id: number
    name: string
    unit: string
    shortUnit: string
    description: string
    datasetId: number
    datasetName: string
    sourceId: number
    sourceName: string
    charts: { id: number, title: string }[]
}

export default class VariableChartPreview extends React.Component<{ variable: Variable }> {
    render() {
        return null
    }
}