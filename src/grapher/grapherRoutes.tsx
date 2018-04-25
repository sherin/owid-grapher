import * as express from 'express'
import * as React from 'react'
import * as _ from 'lodash'

import Chart from '../models/Chart'
import { getVariableData } from '../models/Variable'
import db from '../db'
import {renderToHtmlPage, expectInt} from '../admin/serverUtil'
import ChartPage from './ChartPage'

const grapher = express()

grapher.get('/:slug', async (req, res) => {
    const chart = await Chart.getBySlug(req.params.slug)
    res.send(renderToHtmlPage(<ChartPage chart={chart.config}/>))
})

grapher.get('/data/variables/:variableIds.json', async (req, res) => {
    const variableIds = req.params.variableIds.split("+").map((s: string) => expectInt(s))
    const vardata = await getVariableData(variableIds)
    res.send(vardata)
})

export default grapher