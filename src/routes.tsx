import * as express from 'express'
require('express-async-errors')
import { uniq } from 'lodash'
const cookieParser = require('cookie-parser')

import db from './db'
import {renderToHtmlPage} from './admin/serverUtil'

import * as React from 'react'

const app = express()

app.get('/:slug', async (req, res) => {

})

export default app