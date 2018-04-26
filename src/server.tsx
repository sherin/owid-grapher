import * as express from 'express'
require('express-async-errors')
const errorToSlack = require('express-error-slack').default

import db from './db'
import * as wpdb from './articles/wpdb'
import {NODE_SERVER_PORT, SLACK_ERRORS_WEBHOOK_URL} from './settings'
import routes from './routes'

import * as React from 'react'

const app = express()

//app.use(express.urlencoded())

db.connect()
wpdb.connect()

app.use('/', routes)
app.use(express.static('public'))

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