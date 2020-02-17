import './styles/App.scss';

import React, { FunctionComponent } from 'react';
import { HashRouter, Route } from 'react-router-dom';
import { AppContext, store } from './Store';
import CreateBlog from './CreateBlog';
import Home from './Home';
import Login from './Login';
import CreateSelector from './CreateSelector';

const App: FunctionComponent = () => {

    return (
        <AppContext.Provider value={{}}>
            <HashRouter> 
                <Route exact={true} path='/' render={(props) => {
                    const sites = store.get('sites').length;
                    return sites ? <Home {...props} /> : <CreateSelector {...props} />;
                }} />
                <Route path='/create/blog' component={CreateBlog}/>
                <Route path='/login' component={Login}/>
            </HashRouter>
        </AppContext.Provider>
    );
};

export default App;