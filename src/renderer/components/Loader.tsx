import "./styles/App.css";
import "react-toastify/dist/ReactToastify.css";

import React, { FunctionComponent } from "react";
import { initConfig, initStore, initDb, initExpress } from "../../common/bootstrap";
import { checkDirs } from "../services/utils";
import App from "./App";

// const remote = require("@electron/remote");
// const win = remote.getCurrentWindow();
// const openDevTools = remote.getGlobal("openDevTools");

const Loader: FunctionComponent = () => {
    const [isLoading, setIsLoading] = React.useState(true);
    const [loadingText, setLoadingText] = React.useState("");
  
    const unsetLoading = () => {
        const appElem = document.querySelector("#app") as HTMLDivElement;
        if (appElem) {
        appElem.style.backgroundImage = "";
        appElem.classList.remove("app-loading");
        }
        setIsLoading(false);
    };

    React.useEffect(() => {
        //openDevTools();
        const init = async () => {
            setLoadingText("Initializing Storage");
            await initStore();

            setLoadingText("Initializing Configuration");
            await initConfig();

            setLoadingText("Initializing Database");
            await initDb();

            setLoadingText("Initializing Express");
            await initExpress();

            setLoadingText("Finalizing Startup");
            await checkDirs();

            unsetLoading();
            setIsLoading(false);
        }
        init();
    }, []);

    const Loading = () => (
        <div className="loading-box">
            <span className="loading-icon" />
            <span>{loadingText || ""}</span>
        </div>
    )

    return (
        <>
            {isLoading ? <Loading /> : <App />}
        </>
    );
};

export default Loader;
