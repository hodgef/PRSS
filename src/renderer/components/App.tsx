import React, { FunctionComponent } from 'react';
import { HashRouter, Route } from 'react-router-dom';
import { AppContext } from './Store';
import CreateBlog from './CreateBlog';
import Home from './Home';
import Login from './Login';

import './styles/App.scss';

const App: FunctionComponent = () => {
    return (
        <AppContext.Provider value={{}}>
            <HashRouter> 
                <Route exact={true} path='/' render={(props) => <Home {...props} />} />
                <Route path='/create/blog' component={CreateBlog}/>
                <Route path='/login' component={Login}/>
            </HashRouter>
        </AppContext.Provider>
    );
};

export default App;