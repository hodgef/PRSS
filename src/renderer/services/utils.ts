import fs from "fs";
import { getString, configSet } from "../../common/utils";
import { modal } from "../components/Modal";
import stopwords from "../json/stopwords.json";
import React from "react";
import {
  getApiUrl,
  getCache,
  setCache,
  storeInt,
} from "../../common/bootstrap";

export const merge = (var1, var2) => {
  if (Array.isArray(var1) && Array.isArray(var2)) {
    return [...var1, ...var2];
  } else {
    return { ...var1, ...var2 };
  }
};

export const normalizeStrict = (str: string) => {
  return str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .replace(/[^\w\s-.]/gi, "");
};

export const normalize = (str: string) => {
  return str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\s+/g, "-")
    .replace(/[^\w!.-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/\.\.+/g, ".")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .replace(/[^\w\s-.]/gi, "");
};

export const camelCase = (str: string) => {
  return str
    .toString()
    .replace(/[^\w]+/g, "")
    .normalize("NFD")
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, "");
};

export const getJson = (url, cache = false) => {
  const userAgent = process.env.NODE_ENV !== "production" ? "PRSS_DEV" : "PRSS";
  return new Promise((resolve) => {
    if (cache && getCache(url)) {
      resolve(getCache(url));
    } else {
      require("request")(
        {
          url: url,
          json: true,
          headers: { "User-Agent": userAgent },
        },
        function (error, response, body) {
          cache && setCache(url, body);
          resolve(body);
        }
      );
    }
  });
};

export const getUrl = (url, cache = false) => {
  const userAgent = process.env.NODE_ENV !== "production" ? "PRSS_DEV" : "PRSS";
  return new Promise((resolve) => {
    if (cache && getCache(url)) {
      resolve(getCache(url));
    } else {
      require("request")(
        {
          url: url,
          json: false,
          headers: { "User-Agent": userAgent },
        },
        function (error, response, body) {
          cache && setCache(url, body);
          resolve(body);
        }
      );
    }
  });
};

export const alert = (message: string, title?: string) => {
  modal.alert(message, title);
};

export const error = (
  message = getString("error_occurred"),
  title?: string
) => {
  alert(message, title);
  // dialog.showMessageBox({ title, message });
};

export const confirmation = ({
  title,
  buttons = [{ label: "Yes", action: () => {} }] as any,
  showCancel = true,
  contentClassName = "",
}) => {
  return new Promise((resolve) => {
    const mappedButtons = buttons.map(({ label, action = () => {} }, index) => {
      return {
        label,
        action: () => {
          action();
          resolve(index);
          modal.close();
        },
      };
    });

    modal.confirm({
      title,
      buttons: mappedButtons,
      showCancel,
      onCancel: () => {
        resolve(-1);
      },
      contentClassName,
    });
  });
};

export const ask = ({
  title,
  message,
  buttons,
  showCancel = false,
  renderInput = null,
}) => {
  return new Promise((resolve) => {
    const mappedButtons = buttons.map(({ label, action = (res?) => {} }) => {
      return {
        label,
        action: (res) => {
          action(res);
          resolve(res);
          modal.close();
        },
      };
    });

    modal.prompt({
      title,
      message,
      buttons: mappedButtons,
      showCancel,
      onCancel: () => {
        resolve(-1);
      },
      renderInput,
    });
  });
};

export const stringReplace = (str = "", replaceWith = {}) => {
  Object.keys(replaceWith).forEach((key) => {
    str = str.replace(`{{${key}}}`, replaceWith[key]);
  });

  return str;
};

export const checkDirs = async () => {
  /**
   * Ensure buffer exists
   */
  const bufferDir = storeInt.get("paths.buffer");
  if (!fs.existsSync(bufferDir)) {
    fs.mkdirSync(bufferDir);
  }
};

export const noop = () => {};

export const toJson = (o) => JSON.stringify(o);
export const fromJson = (s: string) => JSON.parse(s);

export const valuesToJson = (input) => {
  let out;

  if (Array.isArray(input)) {
    out = input.map((i) => valuesToJson(i));
  } else if (typeof input === "object") {
    out = {};
    Object.keys(input).forEach((key) => {
      out[key] = input[key] ? toJson(input[key]) : input[key];
    });
  } else {
    return input;
  }

  return out;
};

export const valuesFromJson = (input) => {
  let out;

  if (Array.isArray(input)) {
    out = input.map((i) => valuesFromJson(i));
  } else if (typeof input === "object") {
    out = {};
    Object.keys(input).forEach((key) => {
      out[key] = input[key] ? valuesFromJson(input[key]) : input[key];
    });
  } else {
    return fromJson(input);
  }

  return out;
};

export const mapFieldsFromJSON = (fields = [], obj) => {
  const newObj = { ...obj };
  fields.forEach((field) => {
    if (newObj[field]) {
      newObj[field] = JSON.parse(newObj[field]);
    }
  });
  return newObj;
};

export const mapFieldsToJSON = (fields = [], obj) => {
  const newObj = { ...obj };
  fields.forEach((field) => {
    if (newObj[field]) {
      newObj[field] = JSON.stringify(newObj[field]);
    }
  });
  return newObj;
};

export const sequential = (
  arr: any[],
  asyncFn: (...p: any) => any,
  timeoutWait = 0,
  onUpdate?: (p: any, r: any) => void,
  spreadItems = true,
  index = 0,
  resArr = []
) => {
  if (index >= arr.length) return Promise.resolve(resArr);
  const asyncFnPromise = spreadItems
    ? asyncFn(...arr[index])
    : asyncFn(arr[index]);
  if (!isPromise(asyncFnPromise)) throw new Error("asyncFn must be a promise!");

  return asyncFnPromise.then((r) => {
    const progress = parseInt("" + ((index + 1) * 100) / arr.length);
    if (onUpdate) onUpdate(progress, r);

    return new Promise((resolve) => {
      const timeout = setTimeout(async () => {
        clearTimeout(timeout);
        const res = await sequential(
          arr,
          asyncFn,
          timeoutWait,
          onUpdate,
          spreadItems,
          index + 1,
          [...resArr, r]
        );
        resolve(res);
      }, timeoutWait);
    });
  });
};

export const exclude = (obj = {}, keys = []) => {
  const newObj = { ...obj };

  keys.forEach((key) => {
    delete newObj[key];
  });

  return newObj;
};

export const objGet = (s, obj) =>
  s.split(".").reduce((a, b) => (a ? a[b] : ""), obj);

export const isPromise = (value) =>
  Boolean(value && typeof value.then === "function");

export const sanitizeSite = (siteObj) => {
  const newObj = JSON.parse(JSON.stringify(siteObj));

  /**
   * Remove site keys
   */
  [
    "id",
    "uuid",
    "name",
    "theme",
    "publishedAt",
    "headHtml",
    "footerHtml",
    "sidebarHtml",
    "vars",
  ].forEach((field) => {
    delete newObj[field];
  });

  return newObj;
};

export const getPRSSConfig = async () => {
  const res = ((await getJson(getApiUrl("/config"))) || {}) as any;
  return res;
};

export const getLatestVersion = async () => {
  const res = ((await getJson(getApiUrl("/version"))) || {}) as any;
  return res;
};

export const getGithubSecureAuth = async (code) => {
  const res = ((await getJson(getApiUrl(`/login/github/verify/${code}`))) ||
    {}) as any;
  return res;
};

export const getCurrentVersion = () => {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const { app } = require("@electron/remote");
  let currentVersion;

  if (isDevelopment) {
    currentVersion = require("../../../package.json").version;
  } else {
    currentVersion = app.getVersion();
  }

  return currentVersion;
};

export const notifyNewVersion = async (newVersion) => {
  const response = await confirmation({
    title: [
      React.createElement(
        "p",
        { key: "ver-1a" },
        `Version ${newVersion} is available`
      ),
      React.createElement(
        "p",
        { key: "ver-1b" },
        "Update to the latest version to have the latest improvements and bug fixes."
      ),
    ],
    buttons: [{ label: "Update" }, { label: "Remind me later" }],
    contentClassName: "prss-update",
  });

  /**
   * If "Remind me later"
   */
  if (response === 0) {
    /**
     * Open PRSS download site
     */
    window.open("https://hodgef.com/prss/?d=update");
  } else if (response === 1) {
    configSet("updateCheckSnoozeUntil", Date.now() + 604800000);
  }
};

export const sanitizeSiteItems = (items) => {
  /**
   * Update items
   */
  return items.map((item) => {
    item.content = truncateString(stripTags(item.content));
    return sanitizeItem(item);
  });
};

export const sanitizeItem = (itemObj) => {
  const newObj = JSON.parse(JSON.stringify(itemObj));
  [
    "id",
    "headHtml",
    "footerHtml",
    "sidebarHtml",
    "exclusiveVars",
    "isContentRaw",
    "siteId",
  ].forEach((field) => {
    delete newObj[field];
  });
  return newObj;
};

export const sanitizeBufferItem = (itemObj, mergeObj = {}) => {
  const newObj = { ...JSON.parse(JSON.stringify(itemObj)), ...mergeObj };
  newObj.item = sanitizeItem(newObj.item);
  delete newObj.site;
  return newObj;
};

export const truncateString = (str = "", maxLength = 50) => {
  const output = str.replace(/"/g, "").replace(/\s+/g, " ").trim();
  if (!output) return null;
  if (output.length <= maxLength) return output;
  return `${output.substring(0, maxLength)}...`;
};

export const appendSlash = (str = "/") => {
  let output = str;
  if (str[str.length - 1] !== "/") {
    output += "/";
  }
  return output;
};

export const removeTagsFromElem = (doc, tags) =>
  tags.forEach((tag) =>
    doc.querySelectorAll(tag).forEach((elem) => (elem.innerHTML = ""))
  );

export const stripTags = (html) => {
  const rawHtml = stripShortcodes(html);
  const doc = new DOMParser().parseFromString(rawHtml, "text/html");
  removeTagsFromElem(doc, ["pre", "h1", "h2"]);
  return doc.body.textContent || "";
};

export const stripShortcodes = (html) => {
  let output = html;
  const shortcodeRegex =
    /\[([a-zA-Z]+)=?([a-zA-Z0-9]+)?\](.+?)\[\/[a-zA-Z]+\]?/gi;
  const matches = [...output.matchAll(shortcodeRegex)];
  matches.forEach((match) => {
    const [fullMatch] = match;

    if (fullMatch) {
      output = output.replace(fullMatch, "");
    }
  });
  return output;
};

export const isHtml = RegExp.prototype.test.bind(/(<([^>]+)>)/i);

export const removeStopWords = (str = "") => {
  const words = str.split(" ");
  return words
    .filter((word) => !stopwords.includes(word.toLowerCase()))
    .join(" ");
};
