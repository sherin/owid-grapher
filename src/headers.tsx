export async function getHeaders(): Promise<string> {
    const headers = `/
    Strict-Transport-Security: max-age=63072000; includeSubDomains; preload

/grapher/data/variables/*
Cache-Control: public, max-age=31556926
Access-Control-Allow-Origin: *

/grapher/assets/*
Cache-Control: public, max-age=31556926

/grapher/exports/*
Cache-Control: public, max-age=31556926

/grapher/*
Access-Control-Allow-Origin: *
`

    return headers
}