import './styles/App.scss';

import React, { FunctionComponent } from 'react';
import { HashRouter, Route } from 'react-router-dom';

import CreateBlog from './CreateBlog';
import CreateSelector from './CreateSelector';
import Dashboard from './Dashboard';
import ListPosts from './ListPosts';
import ListSites from './ListSites';
import Login from './Login';
import { StandardModal } from './Modal';
import SitePreview from './SitePreview';
import { AppContext, store } from './Store';

const App: FunctionComponent = () => {
    return (
        <AppContext.Provider value={{}}>
            <HashRouter> 
                <Route exact={true} path='/' render={(props) => {
                    const sites = store.get('sites');
                    return (Object.keys(sites) && Object.keys(sites).length) ?
                        <ListSites {...props} /> : <CreateSelector {...props} />;
                }} />

                <Route path='/create/blog' exact={true} component={CreateBlog}/>

                <Route path='/sites' exact={true} component={ListSites}/>
                <Route path='/sites/:siteId/posts' exact={true} component={ListPosts}/>
                <Route path='/sites/:siteId/preview' exact={true} component={SitePreview}/>
                <Route path='/sites/:siteId' exact={true} component={Dashboard}/>

                <Route path='/login' exact={true} component={Login}/>
            </HashRouter>
            <StandardModal />
        </AppContext.Provider>
    );
};

export default App;