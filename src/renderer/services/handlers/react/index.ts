import { getTemplate, getThemeIndex } from "../../theme";
import { parseHtmlParams, minifyHTML, minifyJS } from "..";
import { sanitizeBufferItem, stripTags, truncateString } from "../../utils";
import { configFileName } from "../../build";
import { parseShortcodes } from "../../shortcode";
import { prssConfig } from "../../../../common/bootstrap";
import { IBufferItem, handlerType } from "../../../../common/interfaces";

const reactHandlerExtension = "js";

/**
 * TODO: This needs a cleanup. Generic functionality to be moved elsewhere
 */
const reactHandler: handlerType = async (templateId, data: IBufferItem) => {
  const templateName = templateId.split(".")[1];
  const isUnbuildable = templateName === "component" || templateName === "none";

  if (isUnbuildable) {
    return [{ name: "index.html", content: "", path: "./" }]
  }

  const templateIndex = await getThemeIndex(data.site.theme);
  const officialThemePath = prssConfig.themes[data.site.theme];

  /**
   * If it's an official template, it will be linked from npm,
   * If it's an user template, it will be fetched from disk
   */
  const templateJs = !officialThemePath
    ? await getTemplate(templateId, reactHandlerExtension)
    : "";

  const baseTemplatePath = officialThemePath
    ? officialThemePath + "/"
    : data.rootPath + "templates/";
  const templatePath =
    baseTemplatePath + `${templateName}.${reactHandlerExtension}`;

  const templateTag = officialThemePath
    ? `<script crossorigin src="${templatePath}"></script>`
    : `<script src="${templatePath}"></script>`;

  /**
   * Html parsing
   */
  const headHtml = parseHtmlParams(data.headHtml, data);
  const footerHtml = parseHtmlParams(data.footerHtml, data);
  const sidebarHtml = minifyHTML(parseHtmlParams(data.sidebarHtml, data));

  const configPath = data.rootPath + configFileName;

  const parseVars = (vars) => {
    const parsedVars = {};
    Object.keys(vars).forEach((varName) => {
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
      stripTags(parsedContent || data.vars?.heroMessage || ""),
      150
    ),
    metaRobots,
    metaLocale,
    metaTitle = data.item.title,
    metaUrl,
    metaSiteName = data.site.title,
    metaImage = data.vars?.featuredImageUrl,
  } = parsedVars;

  const parsedHtml = parseHtmlParams(templateIndex, data)
    .replace(
      "<head>",
      `
        <head>
        
        ${metaDescription
        ? `
                <meta name="description" content="${metaDescription}" />
                <meta name="twitter:description" content="${metaDescription}" />
                `
        : ""
      }
        ${metaRobots ? `<meta name="robots" content="${metaRobots}" />` : ""}
        ${metaLocale
        ? `<meta property="og:locale" content="${metaLocale}" />`
        : ""
      }
        ${metaTitle ? `<meta property="og:title" content="${metaTitle}" />` : ""
      }
        ${metaUrl ? `<link rel="canonical" href="${metaUrl}" />` : ""}
        ${metaUrl ? `<meta property="og:url" content="${metaUrl}" />` : ""}
        ${metaSiteName
        ? `<meta property="og:site_name" content="${metaSiteName}" />`
        : ""
      }
        ${metaImage
        ? `
                <meta name="twitter:image:src" content="${metaImage}" />
                <meta property="og:image" content="${metaImage}" />
                <meta name="twitter:card" content="summary_large_image">
                `
        : ""
      }
        `
    )
    .replace(
      "</head>",
      `
        ${headHtml}
        </head>
    `
    )
    .replace(
      "</body>",
      `
        <script crossorigin src="https://cdn.jsdelivr.net/npm/react@16.13.1/umd/react.production.min.js"></script>
        <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@16.13.1/umd/react-dom.production.min.js"></script>
        ${templateTag}
        <script src="${configPath}"></script>
        [[index.js]]
        ${footerHtml}
        </body>
    `
    )
    .replace(
      "<body>",
      `
        <body>
        <div id="root"></div>
    `
    );

  const parsedData = {
    ...data,
    item: {
      ...data.item,
      content: parsedContent,
    },
    vars: parsedVars,
  };

  const sanitizedBufferItem = sanitizeBufferItem(parsedData, {
    sidebarHtml,
  });

  const js = minifyJS(
    `
        var PRSSElement = React.createElement(PRSSComponent.default, Object.assign(${JSON.stringify(
      sanitizedBufferItem
    )}, { site: PRSSConfig }));
        ReactDOM.render(PRSSElement, document.getElementById("root"));
    `
  );

  const html = minifyHTML(parsedHtml).replace(
    "[[index.js]]",
    `<script>${js}</script>`
  );

  const output = [
    { name: "index.html", content: html, path: "./" },
    //{ name: 'index.js', content: js, path: './' },
  ];

  if (!officialThemePath) {
    output.push({
      name: `${templateName}.js`,
      content: templateJs,
      path: baseTemplatePath,
    });
  }

  return output;
};

export { reactHandler, reactHandlerExtension };
