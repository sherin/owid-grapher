import * as express from 'express'
require('express-async-errors')
import { uniq } from 'lodash'
const cookieParser = require('cookie-parser')

import db from '../db'
import AdminSPA from './AdminSPA'
import LoginPage from './LoginPage'
import {authMiddleware, loginSubmit} from './authentication'
import api from './api'
import devServer from './devServer'
import testPages from './testPages'
import {renderToHtmlPage} from './serverUtil'
import {NODE_SERVER_PORT, BUILD_GRAPHER_URL, SLACK_ERRORS_WEBHOOK_URL} from '../settings'

import * as React from 'react'

const app = express()

// Parse cookies https://github.com/expressjs/cookie-parser
app.use(cookieParser())

// Require authentication for all requests
app.use(authMiddleware)

//app.use(express.urlencoded())

db.connect()

/*app.get('/admin/login', (req, res) => {
    res.send(renderToHtmlPage(<LoginPage/>))
})*/

app.use('/api', api.router)
app.use('/test', testPages)

// Default route: single page admin app
app.get('*', (req, res) => {
    res.send(renderToHtmlPage(<AdminSPA rootUrl={`${BUILD_GRAPHER_URL}`} username={res.locals.user.name}/>))
})

export default app