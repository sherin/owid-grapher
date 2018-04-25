import * as parseArgs from 'minimist'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs-extra'

import { BUILD_DIR } from './settings'
import * as wpdb from './articles/wpdb'
import db from './db'

const argv = parseArgs(process.argv.slice(2))

import routes from './routes'
require('run-middleware')(routes)

interface Response {
    code: number
    data: string
}

function request(url: string): Promise<Response> {
    return new Promise((resolve, reject) => {
        (routes as any).runMiddleware(url, (code: number, data: string) => {
            resolve({ code: code, data: data })
        })
    })
}

async function buildUrl(url: string) {
    const res = await request(url)
    const outPath = path.join(BUILD_DIR, url.match(/\.\w+$/) ? url : `${url}.html`)
    await fs.mkdirp(path.dirname(outPath))
    await fs.writeFile(outPath, res.data)
    console.log(outPath)
}

async function main(email: string, name: string, message: string) {
    db.connect()
    wpdb.connect()
    buildUrl("/child-mortality")
    db.end()
    wpdb.end()
    /*routes.runMiddleware("/child-mortality", (code, data) => {
        console.log(code, data)
    })*/
    /*const baker = new ChartBaker({
        repoDir: path.join(__dirname, `../../public`)
    })

    try {
        await baker.bakeAll()
        await baker.deploy(message || "Automated update", email, name)
    } catch (err) {
        console.error(err)
    } finally {
        baker.end()
    }*/
}

main(argv._[0], argv._[1], argv._[2])
