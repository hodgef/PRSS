import minify from 'babel-minify';
import { baseTemplate, getTemplate } from '../../theme';
import { globalRequire, get } from '../../../../common/utils';
import { parseHtmlParams } from '..';
import { sanitizeBufferItem } from '../../utils';

const htmlMinifier = globalRequire('html-minifier');

const reactHandlerExtension = 'js';

const reactHandler: handlerType = async (templateId, data: IBufferItem) => {
    const templateJs = await getTemplate(templateId, reactHandlerExtension);
    const time = Date.now();

    const minifierOptions = {
        minifyCSS: true,
        minifyJS: true,
        collapseWhitespace: true
    };

    console.log('data', data);

    const siteHeadHtml = parseHtmlParams(data.site.headHtml, data);
    const siteFooterHtml = parseHtmlParams(data.site.footerHtml, data);
    const postHeadHtml = parseHtmlParams(data.item.headHtml, data);
    const postFooterHtml = parseHtmlParams(data.item.footerHtml, data);

    // console.log('siteHeadHtml', siteHeadHtml);
    // console.log('siteFooterHtml', siteFooterHtml);
    // console.log('postHeadHtml', postHeadHtml);
    // console.log('postFooterHtml', postFooterHtml);

    const html = htmlMinifier.minify(
        baseTemplate({
            head: `
                ${siteHeadHtml}
                ${postHeadHtml}
            `,
            body: `
                <div id="root"></div>
                <script crossorigin src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
                <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>
                <script src="${data.configPath}?v=${time}"></script>
                <script src="index.js?v=${time}"></script>
                ${siteFooterHtml}
                ${postFooterHtml}
            `
        }),
        minifierOptions
    );

    console.log('DATA', data);

    const js = minify(`
        ${templateJs}
        var PRSSElement = React.createElement(PRSSComponent.default, Object.assign({ site: PRSSConfig }, ${JSON.stringify(
            sanitizeBufferItem(data)
        )}));
        ReactDOM.render(PRSSElement, document.getElementById("root"));
    `).code;

    return { html, js };
};

export { reactHandler, reactHandlerExtension };
