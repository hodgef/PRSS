import React, { FunctionComponent } from 'react';
import { HashRouter, Route } from "react-router-dom";

import Home from './Home';
import Login from './Login';

const App: FunctionComponent = () => {
    return (
        <HashRouter> 
          <Route exact={true} path='/' render={(props) => <Home {...props} />} />
          <Route path='/login' component={Login}/>
        </HashRouter>
    );
};

export default App;