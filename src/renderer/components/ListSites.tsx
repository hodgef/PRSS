import './styles/ListSites.scss';

import React, { FunctionComponent } from 'react';
import { useHistory } from 'react-router-dom';

import { get } from '../../common/utils';
import Footer from './Footer';
import Header from './Header';

const ListSites: FunctionComponent = () => {
    const sites = get('sites');
    const history = useHistory();

    return (
        <div className="ListSites page">
            <Header />
            <div className="content">
                <h1>
                    <div className="left-align">
                        <span>Your Sites</span>
                    </div>
                    <div className="right-align">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => history.push({
                                pathname: '/sites/create',
                                state: { showBack: true }
                            })}
                        >
                            <i className="material-icons">add</i>
                            <span>Create New</span>
                        </button>
                    </div>
                </h1>
                <div className="items">
                    <ul>
                        {Object.values(sites).map((site) => {
                            const { id, title, type } = site as ISite;

                            return (
                                <li key={id} className="clickable" onClick={() => history.push(`/sites/${id}`)}>
                                    <div className="left-align">
                                        <i className="material-icons">public</i>
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

export default ListSites;