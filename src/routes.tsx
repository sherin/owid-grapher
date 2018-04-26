import * as express from 'express'
require('express-async-errors')

import grapherRoutes from './grapher/grapherRoutes'
import articleRoutes from './articles/articleRoutes'

const routes = express()

routes.use('/grapher', grapherRoutes)
routes.use('/', articleRoutes)

export default routes
