import './styles/Dashboard.scss';

import React, { Fragment, FunctionComponent } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { get, getString } from '../../common/utils';
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
            icon: 'layers',
            route: `/sites/${siteId}/posts`
        },
        {
            title: getString('preview'),
            description: getString('preview_description'),
            icon: 'play_circle_outline',
            route: ''
        },
        {
            title: getString('themes'),
            description: getString('themes_description'),
            icon: 'brush',
            route: ''
        },
        {
            title: getString('settings'),
            description: getString('settings_description'),
            icon: 'settings',
            route: ''
        }
    ]

    return (
        <div className="Dashboard page">
            <Header undertitle={(
                <Fragment>
                    <div className="align-center">
                        <i className="material-icons">public</i><span>{title}</span>
                    </div>
                </Fragment>
            )} />
            <div className="content">
                <h1>
                    <div className="left-align">
                        <i className="material-icons clickable" onClick={() => history.goBack()}>arrow_back</i>
                        <span>Dashboard</span>
                    </div>
                </h1>
                <div className="items">
                    <ul>
                        {features.map(({ title, description, icon, route }) => (
                            <li key={title} className="clickable" onClick={() => route && history.push(route)}>
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