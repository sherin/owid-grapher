import {ChartBaker} from './ChartBaker'
import * as parseArgs from 'minimist'
import * as os from 'os'
import * as path from 'path'
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
    console.log(res.data)
}

async function main(email: string, name: string, message: string) {
    buildUrl("/child-mortality")
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
