import "./styles/App.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import "react-toastify/dist/ReactToastify.css";

import React, { FunctionComponent, useEffect, useState } from "react";
import { HashRouter, Redirect, Route, Switch } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import versionCompare from "semver-compare";
import cx from "classnames";

import Dashboard from "./Dashboard";
import ListPosts from "./ListPosts";
import ListSites from "./ListSites";
import { StandardModal, modal } from "./Modal";
import PostEditor from "./PostEditor";
import CreatePost from "./CreatePost";
import SiteSettings from "./SiteSettings";
import AppSettings from "./AppSettings";
import ThemeManager from "./ThemeManager";
import ListMenus from "./ListMenus";
import MenuEditor from "./MenuEditor";
import { configGet, getCurrentVersion } from "../../common/utils";
import Header from "./Header";
import SiteSetup from "./SiteSetup";
import RouteWrapper from "./RouteWrapper";
import Addons from "./Addons";
import PRSSAI from "./PRSSAI";
import { prssConfig, storeInt } from "../../common/bootstrap";
import { notifyNewVersion } from "../services/utils";
import { Provider } from "./UseProvider";
import { Helmet } from "react-helmet";
import ThemeCreator from "./ThemeCreator";

export const App: FunctionComponent = () => {
  const [headerLeft, setHeaderLeft] = useState(null);
  const [appClass, setAppClass] = useState("");
  const [history, setHistory] = useState(null);

  const commonProps = {
    setHeaderLeftComponent: (value) => {
      setHeaderLeft(value);
    },
    setAppClass: (value) => {
      setAppClass(value);
    },
  };

  const handleRoute = (RouteComponent, props) => {
    setTimeout(() => setHistory(props.history), 0);
    return (
      <RouteWrapper
        {...props}
        {...commonProps}
        RouteComponent={RouteComponent}
      />
    );
  };

  useEffect(() => {
    if(!prssConfig?.latest){
      modal.alert("The PRSS Configuration could not be loaded. Some functionality (such as themes) will be broken. Please ensure that PRSS has internet connection and restart the app.", "PRSS Config Error");
    } else {
      // Appx: Notify about updates
      const latestVersion = prssConfig.latest;
      if(latestVersion && versionCompare(latestVersion, getCurrentVersion()) > 0){
          const snooze = storeInt.get("updateCheckSnoozeUntil");
          console.log("updateCheckSnoozeUntil", snooze);

          if(!snooze || (snooze && new Date() > new Date(parseInt(snooze)))){
              new Notification(`PRSS version ${latestVersion} is available`, { body: "Click here to learn more." }).onclick = () => {
                  notifyNewVersion(latestVersion);
              }
          }
      }
    }
  }, []);

  return (
    <Provider>
      <Helmet>
        <style type="text/css">{`
            body.jodit_fullsize-box_true, html.jodit_fullsize-box_true {
              height: unset !important;
              overflow: unset !important;
              width: unset !important;
            }
        `}</style>
      </Helmet>
      <div className={cx("app-content", appClass)}>
        <div className="app-background" />
        <Header headerLeft={headerLeft} history={history} />
        <HashRouter>
          <Switch>
            <Route
              exact
              path="/sites"
              render={(props) => handleRoute(ListSites, props)}
            />

            <Route
              exact
              path="/settings"
              render={(props) => handleRoute(AppSettings, props)}
            />

            <Route
              exact
              path="/sites/create"
              render={(props) => handleRoute(SiteSetup, props)}
            />

            <Route
              exact
              path="/sites/:siteId/posts"
              render={(props) => handleRoute(ListPosts, props)}
            />

            <Route
              exact
              path="/sites/:siteId/themes"
              render={(props) => handleRoute(ThemeManager, props)}
            />

            <Route
              exact
              path="/sites/:siteId/themes/create"
              render={(props) => handleRoute(ThemeCreator, props)}
            />

            <Route
              exact
              path="/sites/:siteId/settings"
              render={(props) => handleRoute(SiteSettings, props)}
            />

            <Route
              exact
              path="/sites/:siteId/addons"
              render={(props) => handleRoute(Addons, props)}
            />

            <Route
              exact
              path="/sites/:siteId/prssai"
              render={(props) => handleRoute(PRSSAI, props)}
            />

            <Route
              exact
              path="/sites/:siteId/menus"
              render={(props) => handleRoute(ListMenus, props)}
            />

            <Route
              exact
              path="/sites/:siteId/menus/:menuId"
              render={(props) => handleRoute(MenuEditor, props)}
            />

            <Route
              exact
              path="/sites/:siteId/hosting"
              render={(props) => handleRoute(SiteSetup, props)}
            />

            <Route
              exact
              path="/sites/:siteId/posts/editor/:postId"
              render={(props) => handleRoute(PostEditor, props)}
            />

            <Route
              exact
              path="/sites/:siteId/posts/create"
              render={(props) => handleRoute(CreatePost, props)}
            />

            <Route
              exact
              path="/sites/:siteId"
              render={(props) => handleRoute(Dashboard, props)}
            />

            <Route
              exact
              path="/"
              render={() => {
                const sites = configGet("sites");
                return Object.keys(sites) && Object.keys(sites).length ? (
                  <Redirect to="/sites" />
                ) : (
                  <Redirect to="/sites/create" />
                );
              }}
            />

            <Redirect to="/" />
          </Switch>
        </HashRouter>
        <StandardModal />
        <ToastContainer
          className="toast-container"
          position="bottom-right"
          autoClose={3000}
          closeOnClick
          pauseOnHover
          draggable
        />
      </div>
    </Provider>
  );
};
