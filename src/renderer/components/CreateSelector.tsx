import React, { FunctionComponent } from 'react';
import { useHistory } from "react-router-dom";
import Header from './Header';
import Footer from './Footer';

import './styles/CreateSelector.scss';

const CreateSelector: FunctionComponent = () => {
    const history = useHistory();

    return (
        <div className="CreateSelector page">
            <Header />
            <div className="content">
                <button
                    onClick={() => history.push("/create/blog")}
                    type="button"
                    className="btn btn-primary btn-lg mb-3"
                >Create Blog</button>

                <button
                    onClick={() => {}}
                    type="button"
                    className="btn btn-primary btn-lg disabled"
                >Create Docs</button>
            </div>
            <Footer />
        </div>
    );
};

export default CreateSelector;