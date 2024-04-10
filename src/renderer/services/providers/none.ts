import { configGet } from "../../../common/utils";
import { build } from "../build";
import { confirmation } from "../utils";
import { shell } from "electron";
import { getSite } from "../db";
import { storeInt } from "../../../common/bootstrap";
import { modal } from "../../components/Modal";

class FallbackProvider {
  private readonly siteUUID: string;
  public readonly vars = {};
  public static hostingTypeDef = {
    title: "None (Manual deployment)",
    fields: [],
  };

  constructor(siteUUID: string) {
    this.siteUUID = siteUUID;
  }

  fetchSite = () => {
    return getSite(this.siteUUID);
  };

  fetchSiteConfig = () => {
    return configGet(`sites.${this.siteUUID}`);
  };

  setup = async (onUpdate) => {
    /**
     * Build project
     */
    const buildRes = await build(this.siteUUID, onUpdate);

    if (!buildRes) {
      modal.alert(["error_buffer", []]);
      return false;
    }

    return true;
  };

  deploy = async (onUpdate?) => {
    const buildRes = await build(this.siteUUID, onUpdate, null, false, true);

    if (!buildRes) {
      modal.alert(["error_buffer", []]);
      return false;
    }

    const confirmationRes = await confirmation({
      title:
        "You have no hosting set up with this site. Please change hosting or deploy the files manually.",
      buttons: [
        {
          label: "Change hosting",
          action: () => {},
        },
        {
          label: "View Files",
          action: () => {},
        },
      ],
      showCancel: true,
    });

    if (confirmationRes === 0) {
      return {
        type: "redirect",
        value: `/sites/${this.siteUUID}/hosting`,
      };
    }

    if (confirmationRes === 1) {
      const bufferDir = storeInt.get("paths.buffer");

      // if (providedBufferItems && providedBufferItems.length) {
      //     if (providedBufferItems.length > 1) {
      /**
       * Open root buffer dir
       */
      shell.openPath(bufferDir);
      //     } else {
      //         /**
      //          * Open item dir
      //          */
      //         const itemBufferPath = path.join(
      //             bufferDir,
      //             providedBufferItems[0].path
      //         );
      //         shell.openPath(itemBufferPath);
      //     }
      // }
    }

    onUpdate && onUpdate();
    return false;
  };
}

export default FallbackProvider;
