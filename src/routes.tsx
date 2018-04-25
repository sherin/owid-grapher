import * as express from 'express'
require('express-async-errors')

import adminRoutes from './admin/adminRoutes'
import grapherRoutes from './grapher/grapherRoutes'
import articleRoutes from './articles/articleRoutes'

const routes = express()

routes.use('/admin', adminRoutes)
routes.use('/grapher', grapherRoutes)
routes.use('/', articleRoutes)

export default routes
