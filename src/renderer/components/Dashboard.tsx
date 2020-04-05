import './styles/Dashboard.scss';

import React, { Fragment, FunctionComponent, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import cx from 'classnames';

import { get, getString, set, getInt, setInt } from '../../common/utils';
import Footer from './Footer';
import Header from './Header';
import { buildAndDeploy, getRepositoryUrl } from '../services/hosting';
import { toast } from 'react-toastify';
import Loading from './Loading';

const Dashboard: FunctionComponent = () => {
    const { siteId } = useParams();
    const site = get(`sites.${siteId}`) as ISite;
    const { title, url } = site;
    const { publishSuggested } = getInt(`sites.${siteId}`) as ISiteInternal;
    const repositoryUrl = getRepositoryUrl(site);
    const [loading, setLoading] = useState(null);
    const [publishDescription, setPublishDescription] = useState(
        'You have unpublished changes'
    );

    const history = useHistory();

    const features = [
        {
            id: 'posts',
            title: getString('posts'),
            description: getString('posts_description'),
            icon: 'layers',
            className: '',
            onClick: () => {
                history.push(`/sites/${siteId}/posts`);
            }
        },
        {
            id: 'themes',
            title: getString('themes'),
            description: getString('themes_description'),
            icon: 'brush',
            className: '',
            onClick: () => {
                history.push(`/sites/${siteId}/themes`);
            }
        },
        {
            id: 'settings',
            title: getString('settings'),
            description: getString('settings_description'),
            icon: 'settings',
            className: '',
            onClick: () => {
                history.push(`/sites/${siteId}/settings`);
            }
        }
    ];

    if (url) {
        features.push({
            id: 'visit',
            title: getString('visit_site'),
            description: getString('visit_site_description'),
            icon: 'language',
            className: '',
            onClick: () => {
                require('electron').shell.openExternal(url);
            }
        });
    }

    if (repositoryUrl) {
        features.push({
            id: 'repository',
            title: getString('repository'),
            description: getString('repository_description'),
            icon: 'open_in_new',
            className: '',
            onClick: () => {
                require('electron').shell.openExternal(repositoryUrl);
            }
        });
    }

    if (publishSuggested) {
        features.push({
            id: 'publish',
            title: getString('publish'),
            description: publishDescription,
            className: 'box-highlight',
            icon: 'publish',
            onClick: async () => {
                setLoading('publish');
                const site = await get(`sites.${siteId}`);
                await buildAndDeploy(site, setPublishDescription);
                setInt(`sites.${siteId}.publishSuggested`, false);

                toast.success('Publish complete');
                setLoading(null);
            }
        });
    }

    return (
        <div className="Dashboard page">
            <Header
                undertitle={
                    <Fragment>
                        <div className="align-center">
                            <i className="material-icons">public</i>
                            <span>{title}</span>
                        </div>
                    </Fragment>
                }
            />
            <div className="content">
                <h1>
                    <div className="left-align">
                        <i
                            className="material-icons clickable"
                            onClick={() => history.push('/sites')}
                        >
                            arrow_back
                        </i>
                        <span>Dashboard</span>
                    </div>
                </h1>
                <div className="items">
                    <ul>
                        {features.map((item, index) => {
                            const {
                                id,
                                title,
                                description,
                                icon,
                                onClick = () => {},
                                className = ''
                            } = item;
                            return (
                                <li
                                    key={`${title}-${index}`}
                                    className={cx(className, 'clickable')}
                                    onClick={onClick}
                                >
                                    {loading === id ? (
                                        <Loading medium classNames="mr-1" />
                                    ) : (
                                        <i className="material-icons">{icon}</i>
                                    )}

                                    <div className="feature-title">{title}</div>
                                    <div className="feature-description">
                                        {description}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Dashboard;
