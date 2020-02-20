import './styles/Home.scss';

import React, { FunctionComponent } from 'react';

import Footer from './Footer';
// import { useHistory } from "react-router-dom";
import Header from './Header';

const Home: FunctionComponent = () => {
    // const history = useHistory();

    return (
        <div className="Home page">
            <Header />
            <div className="content">
                <h1>Welcome!</h1>
            </div>
            <Footer />
        </div>
    );
};

export default Home;