import { build } from "./build";
import { storeInt } from "../../common/bootstrap";
const remote = require("@electron/remote");

export const startPreview = (startPath = "/") => {
  const bufferDir = storeInt.get("paths.buffer");
  remote.getGlobal("startPreview")({
    server: bufferDir,
    startPath,
  });
};
export const stopPreview = remote.getGlobal("stopPreview");
export const reloadPreview = remote.getGlobal("reloadPreview");
export const pausePreview = remote.getGlobal("pausePreview");
export const resumePreview = remote.getGlobal("resumePreview");
export const isPreviewActive = remote.getGlobal("isPreviewActive");

export const bufferAndStartPreview = async (
  siteUUID: string,
  onUpdate = null,
  openPostId = ""
) => {
  stopPreview();
  const buildRes = await build(siteUUID, onUpdate /*, itemId*/); // Building all

  if (buildRes && buildRes.length) {
    const bufferItem = openPostId
      ? buildRes.find((bItem) => bItem.item.uuid === openPostId)
      : buildRes[0];
    startPreview(bufferItem.path);
  }

  return buildRes;
};
