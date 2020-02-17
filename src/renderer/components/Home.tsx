import React, { FunctionComponent } from 'react';
// import { useHistory } from "react-router-dom";
import Header from './Header';
import Footer from './Footer';

import './styles/Home.scss';

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