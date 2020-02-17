import React, { FunctionComponent } from 'react';
import { useHistory } from "react-router-dom";
import Header from './Header';
import Footer from './Footer';

import './styles/Home.scss';

const Home: FunctionComponent = () => {
    const history = useHistory();

    return (
        <div className="Home page">
            <Header />
            <div className="content">
                <button
                    onClick={() => history.push("/create/blog")}
                    type="button"
                    className="btn btn-primary btn-lg"
                >Create Blog</button>
            </div>
            <Footer />
        </div>
    );
};

export default Home;