import minify from 'babel-minify';
import { baseTemplate, getTemplate } from '../../theme';
import { globalRequire } from '../../../../common/utils';
import { parseHtmlParams } from '..';
import { sanitizeBufferItem } from '../../utils';
import { configFileName } from '../../build';

const htmlMinifier = globalRequire('html-minifier');

const reactHandlerExtension = 'js';

const reactHandler: handlerType = async (templateId, data: IBufferItem) => {
    const templateJs = await getTemplate(templateId, reactHandlerExtension);
    const templateName = templateId.split('.')[1];
    const time = Date.now();

    const minifierOptions = {
        minifyCSS: true,
        minifyJS: true,
        collapseWhitespace: true
    };

    const siteHeadHtml = parseHtmlParams(data.site.headHtml, data);
    const siteFooterHtml = parseHtmlParams(data.site.footerHtml, data);
    const postHeadHtml = parseHtmlParams(data.item.headHtml, data);
    const postFooterHtml = parseHtmlParams(data.item.footerHtml, data);

    const configPath = data.rootPath + configFileName;
    const baseTemplatePath = data.rootPath + 'templates/';
    const templatePath =
        baseTemplatePath + `${templateName}.${reactHandlerExtension}`;

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
                <script src="${templatePath}"></script>
                <script src="${configPath}"></script>
                <script src="index.js?v=${time}"></script>
                ${siteFooterHtml}
                ${postFooterHtml}
            `
        }),
        minifierOptions
    );

    const js = minify(`
        var PRSSElement = React.createElement(PRSSComponent.default, Object.assign(${JSON.stringify(
            sanitizeBufferItem(data)
        )}, { site: PRSSConfig }));
        ReactDOM.render(PRSSElement, document.getElementById("root"));
    `).code;

    return [
        { name: 'index.html', content: html, path: './' },
        { name: 'index.js', content: js, path: './' },
        {
            name: `${templateName}.js`,
            content: templateJs,
            path: baseTemplatePath
        }
    ];
};

export { reactHandler, reactHandlerExtension };
