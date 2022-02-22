import { getSite } from "./db";
import { getBufferItems } from "./build";

const getMenu = async (name, siteId) => {
  const { menus = {} } = await getSite(siteId);
  const menu = menus[name];
  return menu ? menu : null;
};

export const getMenuHtml = async (name, siteId) => {
  const menu = await getMenu(name, siteId);
  const bufferItems = await getBufferItems(siteId);

  if (!menu) return "";

  const parseNode = node => {
    const bufferItem = bufferItems.find(bItem => bItem.item.uuid === node.key);
    const nodeItem = bufferItem.item;
    const parsedChildren = node.children ? node.children.map(parseNode) : [];
    const nodePath =
      bufferItem.path && bufferItem.path[0] === "/"
        ? bufferItem.path.substring(1)
        : bufferItem.path;

    return `<li><a href="#" data-prss-path="${nodePath}">${node.title ||
      nodeItem.title}</a> ${
      parsedChildren.length ? "<ul>" + parsedChildren.join("") + "</ul>" : ""
    }</li>`;
  };

  const parsedNodes = menu.map(parseNode);

  return `<ul class="sc-menu">${parsedNodes.join("")}</ul>`;
};
