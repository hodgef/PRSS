import { IBufferItem } from "../../common/interfaces";
import { getMenuHtml } from "./menus";

const shortcodeRegex =
  /\[([a-zA-Z]+)=?([a-zA-Z0-9]+)?\](.+?)\[\/[a-zA-Z]+\]?/gi;

export const parseShortcodes = async (str = "", data: IBufferItem) => {
  const matches = [...str.matchAll(shortcodeRegex)];
  let output = str;

  const matchPromises = [];
  const matchArr = [];

  matches.forEach((match) => {
    const [fullMatch, fn, param, value] = match;
    matchPromises.push(execShortcode(fn, value, param, data));
    matchArr.push(match);
  });

  const resArr = await Promise.all(matchPromises);

  resArr.forEach((res, index) => {
    const [fullMatch] = matchArr[index];

    if (res) {
      output = output.replace(fullMatch, res);
    }
  });

  return output;
};

export const execShortcode = async (
  fn,
  value,
  param,
  bufferItem: IBufferItem
) => {
  let output = "";
  const {
    site: { uuid: siteUUID },
  } = bufferItem;

  if (!fn || !value) return output;

  switch (fn) {
    case "menu":
      output = await getMenuHtml(value, siteUUID);
      break;

    default:
      break;
  }

  return output;
};
