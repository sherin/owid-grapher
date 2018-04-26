export async function getHeaders(): Promise<string> {
    const headers = `
/grapher/assets/*
Cache-Control: public, max-age=31556926

/grapher/exports/*
Cache-Control: public, max-age=31556926
`

    return headers
}