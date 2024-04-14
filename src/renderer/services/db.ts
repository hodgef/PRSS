import { db } from "../../common/bootstrap";
import { mapFieldsToJSON } from "./utils";
import { JSON_FIELDS } from "../../common/bootstrap";
import { IPostItem, ISite } from "../../common/interfaces";

/**
 * Sites
 */
export const getSites = () => {
  return db("sites");
};

export const getSite = async (siteUUID: string): Promise<ISite> => {
  const site = await getSites().where("uuid", siteUUID).first();
  return site;
};

export const getSiteUUIDById = async (siteId: string): Promise<string> => {
  const { uuid } = await getSites().select("uuid").where("id", siteId).first();
  return uuid;
};

export const createSite = (fields: ISite): Promise<void> => {
  return db.insert(sitesToDB(fields)).into("sites");
};

export const updateSite = async (siteUUID: string, fields: Partial<ISite>): Promise<void> => {
  const res = await getSites()
    .where("uuid", siteUUID)
    .update(sitesToDB(fields));
  return res;
};

export const deleteSite = async (siteUUID: string): Promise<void> => {
  //const { name: siteName } = await getSite(siteUUID);
  await getSites().where("uuid", siteUUID).del();
  await deleteAllSiteItems(siteUUID);

  /**
   * Delete public folder
   */
  // const publicDir = path.join(storeInt.get('paths.public'), siteName);

  // if (!fs.existsSync(publicDir)) {
  //     fs.mkdirSync(publicDir);
  // }
};

/**
 * Map sites
 */
export const sitesToDB = (sitesJS) => {
  const output = mapFieldsToJSON(JSON_FIELDS, sitesJS);
  return output;
};

/**
 * Items
 */
export const getItems = (siteUUID: string) => {
  return db("items").where("siteId", siteUUID);
};

export const getItem = (siteUUID: string, itemUUID: string): Promise<IPostItem> => {
  return getItems(siteUUID).where("uuid", itemUUID).first();
};

export const getItemUUIDById = async (siteUUID: string, itemId: string): Promise<string> => {
  const { uuid } = await getItems(siteUUID)
    .select("uuid")
    .where("id", itemId)
    .first();
  return uuid;
};

export const createItems = (fieldArray: IPostItem[]) => {
  return db.insert(fieldArray.map(itemsToDB)).into("items");
};

export const updateItem = async (
  siteUUID: string,
  itemUUID: string,
  fields: Partial<IPostItem>
) => {
  const res = await getItems(siteUUID)
    .where("uuid", itemUUID)
    .update(itemsToDB(fields));
  return res;
};

export const deleteItem = async (siteUUID: string, itemUUID: string) => {
  const res = await getItems(siteUUID).where("uuid", itemUUID).del();
  return res;
};

export const deleteAllSiteItems = async (siteUUID: string) => {
  const res = await getItems(siteUUID).del();
  return res;
};

/**
 * Map sites
 */
export const itemsToDB = (sitesDb) => {
  const output = mapFieldsToJSON(JSON_FIELDS, sitesDb);
  return output;
};
