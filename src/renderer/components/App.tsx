import './styles/App.scss';
import 'react-toastify/dist/ReactToastify.css';

import React, { FunctionComponent, Fragment } from 'react';
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';

import CreateSite from './CreateSite';
import Dashboard from './Dashboard';
import ListPosts from './ListPosts';
import ListSites from './ListSites';
import { StandardModal } from './Modal';
import PostEditor from './PostEditor';
import CreatePost from './CreatePost';
import SiteSettings from './SiteSettings';
import AppSettings from './AppSettings';
import ThemeManager from './ThemeManager';
import SiteHostingSwitcher from './SiteHostingSwitcher';
import ListMenus from './ListMenus';
import MenuEditor from './MenuEditor';
import { configGet } from '../../common/utils';

const App: FunctionComponent = () => {
    return (
        <Fragment>
            <HashRouter>
                <Switch>
                    <Route exact path="/sites" component={ListSites} />
                    <Route exact path="/settings" component={AppSettings} />
                    <Route exact path="/sites/create" component={CreateSite} />

                    <Route
                        exact
                        path="/sites/:siteId/posts"
                        component={ListPosts}
                    />

                    <Route
                        exact
                        path="/sites/:siteId/themes"
                        component={ThemeManager}
                    />

                    <Route
                        exact
                        path="/sites/:siteId/settings"
                        component={SiteSettings}
                    />

                    <Route
                        exact
                        path="/sites/:siteId/menus"
                        component={ListMenus}
                    />

                    <Route
                        exact
                        path="/sites/:siteId/menus/:menuId"
                        component={MenuEditor}
                    />

                    <Route
                        exact
                        path="/sites/:siteId/hosting"
                        component={SiteHostingSwitcher}
                    />

                    <Route
                        exact
                        path="/sites/:siteId/posts/editor/:postId"
                        component={PostEditor}
                    />

                    <Route
                        exact
                        path="/sites/:siteId/posts/create"
                        component={CreatePost}
                    />

                    <Route exact path="/sites/:siteId" component={Dashboard} />

                    <Route
                        exact
                        path="/"
                        render={() => {
                            const sites = configGet('sites');
                            return Object.keys(sites) &&
                                Object.keys(sites).length ? (
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
                position={toast.POSITION.TOP_RIGHT}
            />
        </Fragment>
    );
};

export default App;
