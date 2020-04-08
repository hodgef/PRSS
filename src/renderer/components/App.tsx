import './styles/App.scss';
import 'react-toastify/dist/ReactToastify.css';

import React, { FunctionComponent } from 'react';
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';

import { AppContext } from '../../common/Store';
import { get } from '../../common/utils';
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

const App: FunctionComponent = () => {
    return (
        <AppContext.Provider value={{}}>
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
                        render={props => {
                            const sites = get('sites');
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
                position={toast.POSITION.BOTTOM_RIGHT}
            />
        </AppContext.Provider>
    );
};

export default App;
