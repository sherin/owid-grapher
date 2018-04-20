import * as express from 'express'
require('express-async-errors')
const errorToSlack = require('express-error-slack').default

import db from './db'
import devStaticServer from './admin/devServer'
import {NODE_SERVER_PORT, SLACK_ERRORS_WEBHOOK_URL} from './settings'

import adminRoutes from './admin/adminRoutes'
import routes from './routes'

import * as React from 'react'

const app = express()

//app.use(express.urlencoded())

db.connect()

app.use('/admin', adminRoutes)
app.use('/', routes)

// Send errors to slack
if (SLACK_ERRORS_WEBHOOK_URL) {
    app.use(errorToSlack({ webhookUri: SLACK_ERRORS_WEBHOOK_URL }))
}

// Give full error messages in production
app.use(async (err: any, req: any, res: any, next: any) => {
    res.status(err.status||500)
    res.send({ error: { message: err.stack, status: err.status||500 } })
})

const HOST = 'localhost'
app.listen(NODE_SERVER_PORT, HOST, () => {
    console.log(`Express started on ${HOST}:${NODE_SERVER_PORT}`)
})
