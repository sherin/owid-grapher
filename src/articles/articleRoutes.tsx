import * as express from 'express'
import * as React from 'react'
import * as url from 'url'
import * as path from 'path'
import * as glob from 'glob'

import {WORDPRESS_DIR} from '../settings'
import * as wpdb from './wpdb'
import {renderToHtmlPage, expectInt} from '../admin/serverUtil'
import {formatPost} from './formatting'
import FrontPage from './FrontPage'
import ArticlePage from './ArticlePage'
import SubscribePage from './SubscribePage'
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

    res.send(renderToHtmlPage(<FrontPage entries={entries} posts={posts}/>))
})

app.get('/subscribe', async (req, res) => {
    return renderToHtmlPage(<SubscribePage/>)
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
                const sortedPaths = _.sortBy(paths, path => fs.statSync(path).size)
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

app.get('/:slug', async (req, res) => {
    // TODO custom permalinks
    const row = await wpdb.get(`SELECT * FROM wp_posts WHERE (post_type='page' OR post_type='post') AND post_status='publish' AND post_name = ?`, [req.params.slug])
    const post = await wpdb.getFullPost(row)

    const entries = await wpdb.getEntriesByCategory()
    const formatted = await formatPost(post, undefined)//this.grapherExports)
    const html = renderToHtmlPage(
        post.type === 'post' ? <BlogPostPage entries={entries} post={formatted}/> : <ArticlePage entries={entries} post={formatted}/>
    )

    res.send(html)
})

export default app