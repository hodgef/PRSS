import "./styles/App.css";
import "react-toastify/dist/ReactToastify.css";

import React, { FunctionComponent, useRef } from "react";
import { initConfig, initStore, initDb, initExpress } from "../../common/bootstrap";
import { checkDirs } from "../services/utils";

// const remote = require("@electron/remote");
// const win = remote.getCurrentWindow();
// const openDevTools = remote.getGlobal("openDevTools");

const Loader: FunctionComponent = () => {
    const App = useRef<React.FunctionComponent<{}>>(null);
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

            const { App: AppImport } = await import("./App") as { App: React.FunctionComponent<{}>};
            App.current = AppImport;

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
            {isLoading ? <Loading /> : <App.current />}
        </>
    );
};

export default Loader;
