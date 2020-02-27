import './styles/App.scss';

import React, { FunctionComponent } from 'react';
import { HashRouter, Route } from 'react-router-dom';

import CreateBlog from './CreateBlog';
import CreateSelector from './CreateSelector';
import Dashboard from './Dashboard';
import ListSites from './ListSites';
import Login from './Login';
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
                <Route path='/create/blog' component={CreateBlog}/>
                <Route path='/sites/:siteId/preview' component={SitePreview}/>
                <Route path='/sites/:siteId' component={Dashboard}/>
                <Route path='/sites' exact={true} component={ListSites}/>
                <Route path='/login' component={Login}/>
            </HashRouter>
        </AppContext.Provider>
    );
};

export default App;