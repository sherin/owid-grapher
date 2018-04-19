import * as mysql from 'mysql'
import * as settings from './settings'

import {DB_NAME, DB_USER, DB_PASS} from './settings'
import DatabaseConnection from './util/DatabaseConnection'

const db = new DatabaseConnection({
    host: 'localhost',
    user: 'root',
    database: settings.DB_NAME
})

export default db