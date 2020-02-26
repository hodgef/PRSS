import './styles/Dashboard.scss';

import React, { FunctionComponent } from 'react';

import Footer from './Footer';
import Header from './Header';

const Dashboard: FunctionComponent = () => {
    return (
        <div className="Dashboard page">
            <Header />
            <div className="content">
                <h1>Dashboard</h1>
            </div>
            <Footer />
        </div>
    );
};

export default Dashboard;