import './styles/Dashboard.scss';

import React, { FunctionComponent } from 'react';
import { useHistory,useParams } from 'react-router-dom';

import { get,getString } from '../services/utils';
import Footer from './Footer';
import Header from './Header';

const Dashboard: FunctionComponent = () => {
    const { siteId } = useParams();
    const { title } = get(`sites.${siteId}`);
    const history = useHistory();

    const features = [
        {
            title: getString('posts'),
            description: getString('posts_description'),
            icon: 'layers'
        },
        {
            title: getString('preview'),
            description: getString('preview_description'),
            icon: 'play_circle_outline'
        },
        {
            title: getString('themes'),
            description: getString('themes_description'),
            icon: 'brush'
        },
        {
            title: getString('settings'),
            description: getString('settings_description'),
            icon: 'settings'
        }
    ]

    return (
        <div className="Dashboard page">
            <Header subtitle={title} />
            <div className="content">
                <h1>
                    <i className="material-icons clickable" onClick={() => history.goBack()}>arrow_back</i>
                    <span>Dashboard</span>
                </h1>
                <div className="items">
                    <ul>
                        {features.map(({ title, description, icon }) => (
                            <li key={title}>
                                <i className="material-icons">{icon}</i>
                                <div className="feature-title">{title}</div>
                                <div className="feature-description">{description}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Dashboard;