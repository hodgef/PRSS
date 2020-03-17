import './styles/App.scss';
import 'react-toastify/dist/ReactToastify.css';

import React, { FunctionComponent } from 'react';
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';

import { AppContext } from '../../common/Store';
import { get } from '../../common/utils';
import CreateBlog from './CreateBlog';
import CreateSelector from './CreateSelector';
import Dashboard from './Dashboard';
import ListPosts from './ListPosts';
import ListSites from './ListSites';
import Login from './Login';
import { StandardModal } from './Modal';
import PostEditor from './PostEditor';
import SitePreview from './SitePreview';

const App: FunctionComponent = () => {
    return (
        <AppContext.Provider value={{}}>
            <HashRouter>
                <Switch>
                    <Route exact path="/sites" component={ListSites} />
                    <Route
                        exact
                        path="/sites/create"
                        component={CreateSelector}
                    />
                    <Route
                        exact
                        path="/sites/create/blog"
                        component={CreateBlog}
                    />

                    <Route
                        exact
                        path="/sites/:siteId/posts"
                        component={ListPosts}
                    />
                    <Route
                        exact
                        path="/sites/:siteId/posts/editor/:postId"
                        component={PostEditor}
                    />
                    <Route
                        exact
                        path="/sites/:siteId/posts/editor"
                        component={PostEditor}
                    />
                    <Route
                        exact
                        path="/sites/:siteId/preview"
                        component={SitePreview}
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
