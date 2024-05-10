import { toast } from "react-toastify";
import { storeInt } from "../../common/bootstrap";
import { runCommandAsync } from "../../common/utils";
import { contextMap } from "../components/UseProvider";
import { removeSpecialChars } from "./utils";

const path = require("path");

export const getPrssaiStatus = async (): Promise<boolean> => {
    if (contextMap?.prssaiStatus) {
        return contextMap.prssaiStatus;
    }

    const prssaiPath = storeInt.get("prssaiPath");

    if (!prssaiPath) {
        return false;
    }

    const runningContainers = (await runCommandAsync(path.join(prssaiPath, "bin"), `docker ps --filter "name=prss" --filter "status=running"`)).res;

    const workerOnline = runningContainers.includes("prssai_worker");
    const chromeOnline = runningContainers.includes("prssai_chrome");
    const redisOnline = runningContainers.includes("prssai_redis");

    contextMap.prssaiStatus = (workerOnline && chromeOnline && redisOnline);
    return contextMap.prssaiStatus;
}

export const sendPrssaiPrompt = async (prompt: string): Promise<string> => {
    const escapedPrompt = removeSpecialChars(prompt);
    if (!escapedPrompt?.trim()) {
        toast.error("The prompt must not be empty");
        return "";
    }

    const prssaiPath = storeInt.get("prssaiPath");
    if (!prssaiPath) {
        return "";
    }

    console.log("prompt", escapedPrompt);

    // Make prompt request
    const promptRes = (await runCommandAsync(path.join(prssaiPath, "bin"), `${path.join(prssaiPath, "bin/prompt_silent")} ${escapedPrompt}`)).res as string;

    console.log("promptRes", promptRes);

    return promptRes;
}

export const restartPrssaiContainers = async () => {
    const prssaiPath = storeInt.get("prssaiPath");

    if (!prssaiPath) {
        return false;
    }

    const restartCmd = (await runCommandAsync(`${prssaiPath}/bin`, `${path.join(prssaiPath, "bin/restart")}`)).res;
    console.log(restartCmd);
}