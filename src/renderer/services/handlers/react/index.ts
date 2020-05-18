import minify from 'babel-minify';
import { getTemplate, getThemeIndex } from '../../theme';
import { globalRequire } from '../../../../common/utils';
import { parseHtmlParams } from '..';
import { sanitizeBufferItem } from '../../utils';
import { configFileName } from '../../build';

const htmlMinifier = globalRequire('html-minifier');

const reactHandlerExtension = 'js';

const reactHandler: handlerType = async (templateId, data: IBufferItem) => {
    const templateIndex = await getThemeIndex(data.site.theme);
    const templateJs = await getTemplate(templateId, reactHandlerExtension);
    const templateName = templateId.split('.')[1];
    const time = Date.now();

    const minifierOptions = {
        minifyCSS: true,
        minifyJS: true,
        collapseWhitespace: true
    };

    const headHtml = parseHtmlParams(data.headHtml, data);
    const footerHtml = parseHtmlParams(data.footerHtml, data);
    const sidebarHtml = htmlMinifier.minify(
        parseHtmlParams(data.sidebarHtml, data),
        minifierOptions
    );

    const configPath = data.rootPath + configFileName;
    const baseTemplatePath = data.rootPath + 'templates/';
    const templatePath =
        baseTemplatePath + `${templateName}.${reactHandlerExtension}`;

    const html = htmlMinifier.minify(
        parseHtmlParams(templateIndex, data)
            .replace(
                '</head>',
                `
                ${headHtml}
                </head>
            `
            )
            .replace(
                '</body>',
                `
                <script crossorigin src="https://cdn.jsdelivr.net/npm/react@16.13.1/umd/react.production.min.js"></script>
                <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@16.13.1/umd/react-dom.production.min.js"></script>
                <script src="${templatePath}"></script>
                <script src="${configPath}"></script>
                <script src="index.js?v=${time}"></script>
                ${footerHtml}
                </body>
            `
            )
            .replace(
                '<body>',
                `
                <body>
                <div id="root"></div>
            `
            ),
        minifierOptions
    );

    const parsedData = {
        ...data,
        item: {
            ...data.item,
            content: parseHtmlParams(data.item.content, data)
        }
    };

    const sanitizedBufferItem = sanitizeBufferItem(parsedData, {
        sidebarHtml
    });

    const js = minify(
        `
        var PRSSElement = React.createElement(PRSSComponent.default, Object.assign(${JSON.stringify(
            sanitizedBufferItem
        )}, { site: PRSSConfig }));
        ReactDOM.render(PRSSElement, document.getElementById("root"));
    `,
        {},
        {
            comments: false
        }
    ).code;

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
