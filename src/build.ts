import * as parseArgs from 'minimist'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs-extra'
import * as _ from 'lodash'

import { getHeaders } from './headers'
import { getRedirects } from './redirects'
import { WORDPRESS_DIR, BASE_DIR, BUILD_DIR } from './settings'
import * as wpdb from './articles/wpdb'
import * as shell from 'shelljs'
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

// TODO proper task queue
const queue: string[] = []

// Add urls to the queue for recaching
export async function purge(urls: string[], userId?: number) {
    queue.push(...urls)
}

// Purge all chart html
async function purgeGrapherHtml() {
    const rows = await db.query(`SELECT JSON_UNQUOTE(JSON_EXTRACT(charts.config, "$.slug")) AS slug FROM charts`)
    const paths = _.sortBy(rows.map((row: any) => `/grapher/${row.slug}`) as string[])
    purge(paths)
}

async function buildUrl(url: string) {
    const res = await request(url)
    const outPath = path.join(BUILD_DIR, url.match(/\.\w+$/) ? url : `${url}.html`)
    await fs.mkdirp(path.dirname(outPath))

    if (res.code === 404 && fs.existsSync(outPath)) {
        await fs.unlink(outPath)
    } else if (res.code === 200) {
        await fs.writeFile(outPath, res.data)
    }

    console.log(outPath)

    // TODO remove directory if nothing in it
}

async function finalizeBuild() {
    // Bake redirects and headers
    await fs.writeFile(`${BUILD_DIR}/_redirects`, await getRedirects())
    await fs.writeFile(`${BUILD_DIR}/_headers`, await getHeaders())

    // Sync static content
    shell.exec(`rsync -havz --delete ${WORDPRESS_DIR}/wp-content ${BUILD_DIR}/`)
    shell.exec(`rsync -havz --delete ${WORDPRESS_DIR}/wp-includes ${BUILD_DIR}/`)
    shell.exec(`rsync -havz --delete ${WORDPRESS_DIR}/slides/ ${BUILD_DIR}/slides`)
    shell.exec(`rsync -havz --delete ${BASE_DIR}/public/* ${BUILD_DIR}/`)
}

async function deploy() {
    if (fs.existsSync(path.join(BUILD_DIR, "netlify.toml"))) {
        // Deploy directly to Netlify (faster than using the github hook)
        shell.exec(`cd ${BUILD_DIR} && netlifyctl deploy -b .`)
    }
}

async function triggerBuild() {
    while (queue.length > 0) {
        const url = queue.shift() as string
        await buildUrl(url)
    }

    await finalizeBuild()
    await deploy()
}

async function main(email: string, name: string, message: string) {
    db.connect()
    wpdb.connect()

    await triggerBuild()
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
