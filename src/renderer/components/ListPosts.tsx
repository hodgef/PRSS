import './styles/ListPosts.scss';

import React, { FunctionComponent } from 'react';
import { useHistory } from 'react-router-dom';

import { get } from '../services/utils';
import Footer from './Footer';
import Header from './Header';

const ListPosts: FunctionComponent = () => {
    const sites = get('sites');
    const history = useHistory();

    return (
        <div className="ListPosts page">
            <Header />
            <div className="content">
                <h1>ListPosts</h1>
                <div className="items">
                    <ul>
                        {Object.values(sites).map((site) => {
                            const { id, title, type } = site as ISite;

                            return (
                                <li key={id} onClick={() => history.push(`/sites/${id}`)}>
                                    <div className="left-align">
                                        <div className="site-title">{title}</div>
                                    </div>
                                    <div className="right-align">
                                        <div className="site-tag">{type}</div>
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

export default ListPosts;