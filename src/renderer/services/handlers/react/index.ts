import minify from 'babel-minify';
import { getTemplate, getThemeIndex } from '../../theme';
import { globalRequire } from '../../../../common/utils';
import { parseHtmlParams } from '..';
import { sanitizeBufferItem, stripTags, truncateString } from '../../utils';
import { configFileName } from '../../build';
import { parseShortcodes } from '../../shortcode';

const htmlMinifier = globalRequire('html-minifier-terser');

const reactHandlerExtension = 'js';

/**
 * TODO: This needs a cleanup. Generic functionality to be moved elsewhere
 */
const reactHandler: handlerType = async (templateId, data: IBufferItem) => {
    const templateIndex = await getThemeIndex(data.site.theme);
    const templateJs = await getTemplate(templateId, reactHandlerExtension);
    const templateName = templateId.split('.')[1];
    const time = Date.now();

    const minifierOptions = {
        minifyCSS: true,
        minifyJS: true,
        removeComments: true,
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

    const parseVars = vars => {
        const parsedVars = {};
        Object.keys(vars).forEach(varName => {
            parsedVars[varName] = parseHtmlParams(vars[varName], data);
        });
        return parsedVars;
    };

    const parsedVars = parseVars(data.vars) as never;
    const parsedContent = await parseShortcodes(
        parseHtmlParams(data.item.content, data),
        data
    );

    const {
        metaDescription = truncateString(
            stripTags(parsedContent || data.vars?.heroMessage || ''),
            150
        ),
        metaRobots,
        metaLocale,
        metaTitle = data.item.title,
        metaUrl,
        metaSiteName = data.site.title,
        metaImage = data.vars?.featuredImageUrl
    } = parsedVars;

    const parsedHtml = parseHtmlParams(templateIndex, data)
        .replace(
            '<head>',
            `
        <head>
        
        ${
            metaDescription
                ? `<meta name="description" content="${metaDescription}" />`
                : ''
        }
        ${metaRobots ? `<meta name="robots" content="${metaRobots}" />` : ''}
        ${
            metaLocale
                ? `<meta property="og:locale" content="${metaLocale}" />`
                : ''
        }
        ${
            metaTitle
                ? `<meta property="og:title" content="${metaTitle}" />`
                : ''
        }
        ${metaUrl ? `<link rel="canonical" href="${metaUrl}" />` : ''}
        ${metaUrl ? `<meta property="og:url" content="${metaUrl}" />` : ''}
        ${
            metaSiteName
                ? `<meta property="og:site_name" content="${metaSiteName}" />`
                : ''
        }
        ${
            metaImage
                ? `<meta property="og:image" content="${metaImage}" />`
                : ''
        }
        `
        )
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
        );

    const html = htmlMinifier.minify(parsedHtml, minifierOptions);

    const parsedData = {
        ...data,
        item: {
            ...data.item,
            content: parsedContent
        },
        vars: parsedVars
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
