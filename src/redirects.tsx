import db from './db'
import * as wpdb from './articles/wpdb'

export async function getRedirects(): Promise<string[]> {
    const redirects = [
        // Let's Encrypt certbot verification
        "/.well-known/* https://owid.cloud/.well-known/:splat 200",

        // RSS feed
        "/feed /atom.xml 302",

        // Backwards compatibility-- admin urls
        "/wp-admin/* https://owid.cloud/wp-admin/:splat 302",
        "/wp-login.php https://owid.cloud/wp-login.php 302",
        "/grapher/admin/* https://owid.cloud/grapher/admin/:splat 302",

        // Backwards compatibility-- old Max stuff that isn't static-friendly
        "/roser/* https://www.maxroser.com/roser/:splat 302",
        "/wp-content/uploads/nvd3/* https://www.maxroser.com/owidUploads/nvd3/:splat 302",
        "/wp-content/uploads/datamaps/* https://www.maxroser.com/owidUploads/datamaps/:splat 302",
        "/slides/Max_PPT_presentations/* https://www.maxroser.com/slides/Max_PPT_presentations/:splat 302",
        "/slides/Max_Interactive_Presentations/* https://www.maxroser.com/slides/Max_Interactive_Presentations/:splat 302",

        // Backwards compatibility-- public urls
        "/entries /#entries 302",
        "/data/food-agriculture/land-use-in-agriculture /yields-and-land-use-in-agriculture 301",

        // Backwards compatibility-- grapher url style
        "/chart-builder/* /grapher/:splat 301",
        "/grapher/public/* /grapher/:splat 301",
        "/grapher/view/* /grapher/:splat 301",

        // Main grapher chart urls are proxied through to separate repo
        "/grapher/* https://owid-grapher.netlify.com/grapher/:splat 200",
    ]

    // Add wordpress plugin redirects (TODO: move these into owid-admin)
    const wpRows = await wpdb.query(`SELECT url, action_data, action_code FROM wp_redirection_items`)
    redirects.push(...wpRows.map(row => `${row.url} ${row.action_data} ${row.action_code}`))

    // Redirect /grapher/latest
    const latestRows = await db.query(`SELECT JSON_EXTRACT(config, "$.slug") as slug FROM charts where starred=1`)
    for (const row of latestRows) {
        redirects.push(`/grapher/latest /grapher/${JSON.parse(row.slug)} 302`)
    }

    // Redirect old grapher slugs to new slugs
    const rows = await db.query(`
        SELECT chart_slug_redirects.slug, chart_id, JSON_EXTRACT(charts.config, "$.slug") as trueSlug
        FROM chart_slug_redirects INNER JOIN charts ON charts.id=chart_id
    `)

    for (const row of rows) {
        const trueSlug = JSON.parse(row.trueSlug)
        if (row.slug !== trueSlug) {
            redirects.push(`/grapher/${row.slug} /grapher/${trueSlug} 302`)
        }
    }

    return redirects
}