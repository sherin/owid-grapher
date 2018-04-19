// A simple static file server for development that imitates Netlify production behavior

import {Express, Router, Response} from 'express'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as minimatch from 'minimatch'
import * as urljoin from 'url-join'
import * as querystring from 'querystring'

import {ENV, BUILD_URL, BUILD_DIR} from '../settings'

const devServer = Router()

async function getRedirects(): Promise<{ from: string, to: string }[]> {
    const buffer = await fs.readFile(path.join(BUILD_DIR, "_redirects"))
    return buffer.toString('utf8').split("\n").map(line => {
        const spl = line.split(" ")
        return { from: spl[0], to: spl[1] }
    })
}

class HeaderRule {
    matchRule: string
    headers: string[][]
    constructor(block: string) {
        const lines = block.split("\n")
        this.matchRule = lines[0]
        this.headers = []
        for (const line of lines.slice(1)) {
            if (line.trim()) {
                this.headers.push(line.split(": ").map(s => s.trim()))
            }
        }
    }

    match(matchPath: string) {
        return minimatch(matchPath, this.matchRule)
    }

    apply(res: Response) {
        for (const header of this.headers)
            res.header(header[0], header[1])
    }
}

async function getHeaderRules(): Promise<HeaderRule[]> {
    const buffer = await fs.readFile(path.join(BUILD_DIR, "_headers"))
    return buffer.toString("utf8").split("\n\n").map(block =>
        new HeaderRule(block)
    )
}

async function serveFile(res: Response, targetPath: string) {
    res.sendFile(targetPath)
}

devServer.get('/*', async (req, res) => {
    if (ENV === "production") {
        // No dev server in production, redirect to static build
        res.redirect(urljoin(BUILD_URL, req.path) + (req.query ? `?${querystring.stringify(req.query)}` : ''))
        return
    }

    const redirects = await getRedirects()
    const headerRules = await getHeaderRules()

    // Apply redirects
    for (const redirect of redirects) {
        if (redirect.from === req.path) {
            res.redirect(redirect.to)
            return
        }
    }

    // Apply header rules
    for (const rule of headerRules) {
        if (rule.match(`${req.path}`)) {
            rule.apply(res)
        }
    }

    let targetPath = path.join(BUILD_DIR, req.path)
    if (fs.existsSync(targetPath+".html"))
        targetPath += ".html"

    serveFile(res, targetPath)
})

export default devServer
