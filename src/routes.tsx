import * as express from 'express'
import * as React from 'react'

import * as wpdb from './wordpress/wpdb'
import {renderToHtmlPage} from './admin/serverUtil'
import {formatPost} from './wordpress/formatting'
import ArticlePage from './wordpress/ArticlePage'
import BlogPostPage from './wordpress/BlogPostPage'

const app = express()

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