import "./styles/Header.css";

import cx from "classnames";
import React, {
  FunctionComponent,
  ReactNode,
  useState,
  useEffect,
  useRef,
} from "react";
const isFrameless = process.platform !== "darwin";
const remote = require("@electron/remote");
const win = remote.getCurrentWindow();
const openDevTools = remote.getGlobal("openDevTools");

import PRSSLogo from "../images/prss-sm.png";
import minImg from "../images/icons/min-k-30.png";
import maxImg from "../images/icons/max-k-30.png";
import restoreImg from "../images/icons/restore-k-30.png";
import closeImg from "../images/icons/close-k-30.png";

import { configGet } from "../../common/utils";
import { modal } from "./Modal";
import AboutModalContent from "./AboutModalContent";
import { getCurrentVersion, notifyNewVersion } from "../services/utils";
import { prssConfig } from "../../common/bootstrap";
import versionCompare from "semver-compare";

interface IProps {
  headerLeft?: ReactNode;
  history: any;
}

const Header: FunctionComponent<IProps> = ({ headerLeft, history }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const headerMore = useRef(null);
  const hasSites = configGet("sites") || {};
  const [isMaximized, setIsMaximized] = useState(false);
  const currentVersion = getCurrentVersion();
  const latestVersion = prssConfig.version;

  const toggleMaximize = () => {
    const newState = !win.isMaximized();
    setIsMaximized(newState);
    newState ? win.maximize() : win.unmaximize();
  };

  const maxHandler = () => {
    setIsMaximized(true);
  };

  const minHandler = () => {
    setIsMaximized(false);
  };

  useEffect(() => {
    win.on("maximize", maxHandler);
    win.on("unmaximize", minHandler);

    return () => {
      win.removeListener("maximize", maxHandler);
      win.removeListener("unmaximize", minHandler);
    };
  }, []);

  return (
    <header className={cx({ "has-header-left": headerLeft })}>
      <div
        className={cx("header-cont", {
          "title-mode": isFrameless,
        })}
      >
        <div className="left-align">
          <div
            className={cx("logo", {
              clickable: Object.keys(hasSites).length,
            })}
            onClick={() =>
              Object.keys(hasSites).length && history.push("/sites")
            }
          >
            <img src={PRSSLogo} width="30" />
          </div>
          {headerLeft && <div className="header-subtitle">{headerLeft}</div>}
        </div>
        <div className="right-align">
          <div className="header-more" ref={headerMore}>
            <button
              type="button"
              className={cx("btn btn-transparent btn-lg", {
                expanded: showMoreMenu,
              })}
              onClick={() => setShowMoreMenu(!showMoreMenu)}
            >
              <span className="material-icons">expand_more</span>
            </button>
            {showMoreMenu && (
              <React.Fragment>
                <div
                  className="back-overlay"
                  onClick={() => setShowMoreMenu(false)}
                ></div>
                <ul className="drop-menu">
                  {versionCompare(latestVersion, currentVersion) > 0 && (
                    <li
                      className="clickable highlight-li"
                      onClick={() => {
                        setShowMoreMenu(false);
                        notifyNewVersion(latestVersion);
                      }}
                    >
                      <span className="material-icons">check_circle</span>
                      <span>Update PRSS</span>
                    </li>
                  )}
                  
                  <li
                    className="clickable"
                    onClick={() => {
                      setShowMoreMenu(false);
                      history.push("/settings");
                    }}
                  >
                    <span className="material-icons">settings</span>
                    <span>Settings</span>
                  </li>

                  <li
                    className="clickable"
                    onClick={() => {
                      setShowMoreMenu(false);
                      openDevTools();
                    }}
                  >
                    <span className="material-icons">code</span>
                    <span>Developer Tools</span>
                  </li>
                  
                  <li
                    className="clickable"
                    onClick={() => {
                      setShowMoreMenu(false);
                      modal.alert(
                        <AboutModalContent version={currentVersion} />,
                        false,
                        "about-modal"
                      );
                    }}
                  >
                    <span className="material-icons">info</span>
                    <span>About</span>
                  </li>
                </ul>
              </React.Fragment>
            )}
          </div>
          <div className="window-controls">
            <div
              className="btn btn-transparent btn-lg"
              onClick={() => win.minimize()}
            >
              <img className="icon" src={minImg} draggable="false" />
            </div>

            <div
              className="btn btn-transparent btn-lg"
              onClick={() => toggleMaximize()}
            >
              <img
                className="icon"
                src={isMaximized ? restoreImg : maxImg}
                draggable="false"
              />
            </div>

            <div
              className="btn btn-transparent btn-lg"
              onClick={() => win.close()}
            >
              <img className="icon" src={closeImg} draggable="false" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
