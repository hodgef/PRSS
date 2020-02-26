import './styles/SitePreview.scss';

import React, { FunctionComponent } from 'react';
import { useParams } from 'react-router-dom';

import Footer from './Footer';
import Header from './Header';

const SitePreview: FunctionComponent = () => {
    const { siteId } = useParams();

    return (
        <div className="SitePreview page">
            <Header />
            <div className="content">
                <h1>SitePreview! {siteId}</h1>
            </div>
            <Footer />
        </div>
    );
};

export default SitePreview;