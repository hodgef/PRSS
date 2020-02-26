import './styles/App.scss';

import React, { FunctionComponent } from 'react';
import { HashRouter, Route } from 'react-router-dom';

import CreateBlog from './CreateBlog';
import CreateSelector from './CreateSelector';
import Dashboard from './Dashboard';
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
                        <Dashboard {...props} /> : <CreateSelector {...props} />;
                }} />
                <Route path='/create/blog' component={CreateBlog}/>
                <Route path='/site/:siteId/preview' component={SitePreview}/>
                <Route path='/login' component={Login}/>
            </HashRouter>
        </AppContext.Provider>
    );
};

export default App;