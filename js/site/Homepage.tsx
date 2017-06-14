import * as React from 'react'
import * as ReactDOMServer from 'react-dom/server'
import * as UniversalRouter from 'universal-router'
import * as fetch from 'isomorphic-fetch'

class Homepage extends React.Component<{}, undefined> {
    render() {
        return <div>
            <div id="homepage-cover">
                <div className="lead-in">
                    <h1 className="desktop">Our world is changing</h1>
                    <div className="desktop subheading" style="font-family: Georgia;">Explore the ongoing history of human civilization at the broadest level, through research and data visualization.</div>
                    <div className="mobile subheading">Living conditions around the world are changing rapidly. Explore how and why.</div>
                    <img className="down-arrow" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAMAAAC7IEhfAAAAM1BMVEUAAAD/zB//zB//zB//zB//zB//zB//zB//zB//zB//zB//zB//zB//zB//zB//zB//zB8l5oYuAAAAEHRSTlMAECAwQFBgcICPn6+/z9/vIxqCigAAAVxJREFUOMuFlcsWwyAIRFF8izr//7VdNK2KTeomJ+YGZggSon3ZkLJISZHpYdnc8V2juBvMCYCanCNiF8sAeviBmQz0YJYdL4BYzXGf7zPPHEMF9QPlG03kux+BtMkD4rxbQHJjJXlgzbCC2zPT13gKJAY+mjMq3YMU0a4yY5gnkORKXqBKoEGLvlwewCtU3J38AhmViBrsP5A6DJmPpycww5ND/g96JIoI/0GLSglbfxb7Bm3ZSIgGM5IRMUkJOkEGeu8dqhQnSO19YlQpIIeZ8AbDYUaXxwwAuk080lnwAgDlLDg1GPVhMVv1K9wQZd0U7bDCaL/arByZr46tp2/teVyBd4+sJcpHXFapxlAZ2jyu4eG4jplADYCU6G447Pq937iinM4hZcw6pFSpeKAfE5YFZ/+bCsi26wrQ+GY0jxqdJTIulH4zmomIuIw57FH904+BY6oikpIW/AINdBKzcQVAtQAAAABJRU5ErkJggg=="/>
                    <div className="title-author-byline">A web publication by <a href="http://www.MaxRoser.com/about" target="_blank" rel="noopener">Max Roser</a></div>
                </div>
            </div>
            <div id="homepage-content" className="clearfix">
                <div id="homepage-latest">
                    <h3><a href="/grapher/latest">Latest Visualization</a></h3>
                    <iframe src="/grapher/latest" width="100%" height="660px"></iframe>
                </div>
            </div>
        </div>
    }
}

class SiteLayout extends React.Component<{}, undefined> {
    render() {
        return <html>
            <head>
            </head>
            <body>
                {this.props.children}
            </body>
        </html>
    }
}

class Page extends React.Component<{ page: any }, undefined> {
    render() {
        const {page} = this.props

        return <div dangerouslySetInnerHTML={{__html: page.content.rendered}}/>
    }
}

const router = new UniversalRouter([
    {
        path: '/:slug',
        action: async function(context) {
            const response = await fetch('https://ourworldindata.org/wp-json/wp/v2/pages?slug=' + context.params.slug)
            const page = JSON.parse(await response.text())[0]
            return <SiteLayout>
                <Page page={page}/>
            </SiteLayout>
        }
    }
])

export default class TestComponent extends React.Component<{}, undefined> {
    static renderToString() {        
        router.resolve('/world-population-growth').then(html => {
            console.log(ReactDOMServer.renderToStaticMarkup(html))
        })
    }
}
