import "./styles/App.css";
import "react-toastify/dist/ReactToastify.css";

import React, { FunctionComponent, Fragment, useState, useEffect } from "react";
import { HashRouter, Redirect, Route, Switch } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import cx from "classnames";
import versionCompare from "semver-compare";

import Dashboard from "./Dashboard";
import ListPosts from "./ListPosts";
import ListSites from "./ListSites";
import { StandardModal } from "./Modal";
import PostEditor from "./PostEditor";
import CreatePost from "./CreatePost";
import SiteSettings from "./SiteSettings";
import AppSettings from "./AppSettings";
import ThemeManager from "./ThemeManager";
import ListMenus from "./ListMenus";
import MenuEditor from "./MenuEditor";
import { configGet } from "../../common/utils";
import Header from "./Header";
import SiteSetup from "./SiteSetup";
import RouteWrapper from "./RouteWrapper";

const App: FunctionComponent = () => {
  const [headerLeft, setHeaderLeft] = useState(null);
  const [appClass, setAppClass] = useState("");
  const [history, setHistory] = useState(null);

  const commonProps = {
    setHeaderLeftComponent: value => {
      setHeaderLeft(value);
    },
    setAppClass: value => {
      setAppClass(value);
    }
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

  return (
    <div className={cx("app-content", appClass)}>
      <div className="app-background" />
      <Header headerLeft={headerLeft} history={history} />
      <HashRouter>
        <Switch>
          <Route
            exact
            path="/sites"
            render={props => handleRoute(ListSites, props)}
          />

          <Route
            exact
            path="/settings"
            render={props => handleRoute(AppSettings, props)}
          />

          <Route
            exact
            path="/sites/create"
            render={props => handleRoute(SiteSetup, props)}
          />

          <Route
            exact
            path="/sites/:siteId/posts"
            render={props => handleRoute(ListPosts, props)}
          />

          <Route
            exact
            path="/sites/:siteId/themes"
            render={props => handleRoute(ThemeManager, props)}
          />

          <Route
            exact
            path="/sites/:siteId/settings"
            render={props => handleRoute(SiteSettings, props)}
          />

          <Route
            exact
            path="/sites/:siteId/menus"
            render={props => handleRoute(ListMenus, props)}
          />

          <Route
            exact
            path="/sites/:siteId/menus/:menuId"
            render={props => handleRoute(MenuEditor, props)}
          />

          <Route
            exact
            path="/sites/:siteId/hosting"
            render={props => handleRoute(SiteSetup, props)}
          />

          <Route
            exact
            path="/sites/:siteId/posts/editor/:postId"
            render={props => handleRoute(PostEditor, props)}
          />

          <Route
            exact
            path="/sites/:siteId/posts/create"
            render={props => handleRoute(CreatePost, props)}
          />

          <Route
            exact
            path="/sites/:siteId"
            render={props => handleRoute(Dashboard, props)}
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
        hideProgressBar
        position={toast.POSITION.BOTTOM_RIGHT}
      />
    </div>
  );
};

export default App;
