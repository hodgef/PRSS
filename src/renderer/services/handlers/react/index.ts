import minify from 'babel-minify';
import { baseTemplate, getTemplate } from '../../templates';
import { globalRequire } from '../../../../common/utils';

const htmlMinifier = globalRequire('html-minifier');

const template_extension = 'js';

const handler: handlerType = async (templateId, data: IBufferItem) => {
    const templateJs = await getTemplate(templateId, template_extension);
    const time = Date.now();

    const html = htmlMinifier.minify(
        baseTemplate({
            // head: `
            //     <title>${data.site.title}</title>
            // `,
            body: `
                <div id="root"></div>
                <script crossorigin src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
                <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>
                <script src="${data.configPath}?=${time}"></script>
                <script src="index.js?=${time}"></script>
            `
        }),
        {
            collapseWhitespace: true
        }
    );

    console.log('DATA', data);

    const js = minify(`
        ${templateJs}
        var PRSSElement = React.createElement(PRSSComponent.default, Object.assign({ site: PRSSConfig }, ${JSON.stringify(
            data
        )}));
        ReactDOM.render(PRSSElement, document.getElementById("root"));
    `).code;

    return { html, js };
};

export default handler;
