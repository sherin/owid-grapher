import * as express from 'express'
import * as React from 'react'
import * as url from 'url'
import * as path from 'path'
import * as glob from 'glob'
import * as _ from 'lodash'
import * as fs from 'fs-extra'
import * as parseUrl from 'url-parse'

import {BUILD_URL, WORDPRESS_DIR} from '../settings'
import * as wpdb from './wpdb'
import {renderToHtmlPage, expectInt, HttpError} from '../admin/serverUtil'
import {formatPost, FormattedPost} from './formatting'
import FrontPage from './FrontPage'
import ArticlePage from './ArticlePage'
import SubscribePage from './SubscribePage'
import BlogIndexPage from './BlogIndexPage'
import BlogPostPage from './BlogPostPage'

const app = express()

app.get('/', async (req, res) => {
    const postRows = await wpdb.query(`
        SELECT ID, post_title, post_date, post_name FROM wp_posts
        WHERE post_status='publish' AND post_type='post' ORDER BY post_date DESC LIMIT 6`)

    const permalinks = await wpdb.getPermalinks()

    const posts = postRows.map(row => {
        return {
            title: row.post_title,
            date: new Date(row.post_date),
            slug: permalinks.get(row.ID, row.post_name)
        }
    })

    const entries = await wpdb.getEntriesByCategory()

    res.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    res.send(renderToHtmlPage(<FrontPage entries={entries} posts={posts}/>))
})

app.get('/subscribe', async (req, res) => {
    res.send(renderToHtmlPage(<SubscribePage/>))
})

async function renderBlogIndexByPageNum(pageNum: number) {
    const postsPerPage = 21

    const allPosts = await wpdb.getBlogIndex()

    const numPages = Math.ceil(allPosts.length/postsPerPage)
    const posts = allPosts.slice((pageNum-1)*postsPerPage, pageNum*postsPerPage)

    for (const post of posts) {
        if (post.imageUrl) {
            // Find a smaller version of this image
            try {
                const pathname = url.parse(post.imageUrl).pathname as string
                const paths = glob.sync(path.join(WORDPRESS_DIR, pathname.replace(/.png/, "*.png")))
                const sortedPaths = _.sortBy(paths, p => fs.statSync(p).size)
                post.imageUrl = sortedPaths[sortedPaths.length-3].replace(WORDPRESS_DIR, '')
            } catch (err) {
                console.error(err)
                // Just use the big one
            }
        }
    }

    const entries = await wpdb.getEntriesByCategory()
    return renderToHtmlPage(<BlogIndexPage entries={entries} posts={posts} pageNum={pageNum} numPages={numPages}/>)
}

app.get('/blog', async (req, res) => {
    res.send(await renderBlogIndexByPageNum(1))
})

app.get('/blog/page/:pageNum', async (req, res) => {
    res.send(await renderBlogIndexByPageNum(expectInt(req.params.pageNum)))
})

app.get('/atom.xml', async (req, res) => {
    const postRows = await wpdb.query(`SELECT * FROM wp_posts WHERE post_type='post' AND post_status='publish' ORDER BY post_date DESC LIMIT 10`)

    const posts: FormattedPost[] = []
    for (const row of postRows) {
        const fullPost = await wpdb.getFullPost(row)
        posts.push(await formatPost(fullPost))
    }

    const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
    <title>Our World in Data</title>
    <subtitle>Living conditions around the world are changing rapidly. Explore how and why.</subtitle>
    <id>${BUILD_URL}/</id>
    <link type="text/html" rel="alternate" href="${BUILD_URL}"/>
    <link type="application/atom+xml" rel="self" href="${BUILD_URL}/atom.xml"/>
    <updated>${posts[0].date.toISOString()}</updated>
    ${posts.map(post => `<entry>
        <title>${post.title}</title>
    <id>${BUILD_URL}/${post.slug}</id>
        <link rel="alternate" href="${BUILD_URL}/${post.slug}"/>
        <published>${post.date.toISOString()}</published>
        <updated>${post.modifiedDate.toISOString()}</updated>
        ${post.authors.map(author => `<author><name>${author}</name></author>`).join("")}
        <summary>${post.excerpt}</summary>
    </entry>`).join("\n")}
</feed>
`

    res.set('Content-Type', 'text/xml')
    res.send(feed)
})

// Get wordpress pages/posts (due to custom permalinks slug may include slashes)
app.get(/.*/, async (req, res) => {
    const pathSlug = req.path.slice(1)
    const permalink = await wpdb.get(`SELECT post_id FROM wp_postmeta WHERE meta_key='custom_permalink' AND meta_value=? OR meta_value=?`, [pathSlug, pathSlug+'/'])

    let row
    if (permalink !== undefined) {
        row = await wpdb.get(`SELECT * FROM wp_posts WHERE (post_type='page' OR post_type='post') AND post_status='publish' AND ID = ?`, [permalink.post_id])
    } else {
        row = await wpdb.get(`SELECT * FROM wp_posts WHERE (post_type='page' OR post_type='post') AND post_status='publish' AND post_name = ?`, [pathSlug])
    }

    if (row === undefined) {
        throw new HttpError("No such post", 404)
    }

    const post = await wpdb.getFullPost(row)
    const entries = await wpdb.getEntriesByCategory()
    const formatted = await formatPost(post, undefined)//this.grapherExports)
    const html = renderToHtmlPage(
        post.type === 'post' ? <BlogPostPage entries={entries} post={formatted}/> : <ArticlePage entries={entries} post={formatted}/>
    )

    res.send(html)
})

export default app