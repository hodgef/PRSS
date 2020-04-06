import './styles/ListSites.scss';

import React, { FunctionComponent, useState, Fragment } from 'react';
import { useHistory } from 'react-router-dom';

import { get } from '../../common/utils';
import Footer from './Footer';
import Header from './Header';
import { toast } from 'react-toastify';
import { deleteSites } from '../services/hosting';
import DraggableTree from './DraggableTree';

const ListSites: FunctionComponent = () => {
    const sites = get('sites');
    const history = useHistory();

    const [selectEnabled, setSelectEnabled] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);

    const toggleSelectEnabled = () => setSelectEnabled(!selectEnabled);

    const deleteSelectedSites = async () => {
        const deleteSuccess = await deleteSites(selectedItems);

        if (deleteSuccess) {
            toast.success('Sites deleted!');
            setSelectedItems([]);
            setSelectEnabled(false);
        } else {
            toast.error('No deletion made');
        }

        /**
         * If there's no sites, redirect to create
         */
        const newSites = get('sites');
        if (!Object.keys(newSites).length) {
            history.push('/sites/create');
        }
    };

    const formatSites = rawSitesObj => {
        const values = Object.values(rawSitesObj) as [];
        return values.map(({ id, title }) => ({
            key: id,
            title: (
                <Fragment>
                    <div className="left-align">
                        <i className="material-icons mr-2">public</i>
                        <div className="site-title">{title}</div>
                    </div>
                    <div className="right-align"></div>
                </Fragment>
            ),
            children: []
        }));
    };

    const onItemClick = itemId => {
        history.push(`/sites/${itemId}`);
    };

    return (
        <div className="ListSites page">
            <Header />
            <div className="content">
                <h1>
                    <div className="left-align">
                        <span>Your Sites</span>
                    </div>
                    <div className="right-align">
                        {!!Object.keys(sites).length && (
                            <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={toggleSelectEnabled}
                            >
                                Toggle Select
                            </button>
                        )}
                        {!!selectedItems.length && (
                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => deleteSelectedSites()}
                            >
                                <i className="material-icons">delete</i>
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() =>
                                history.push({
                                    pathname: '/sites/create',
                                    state: { showBack: true }
                                })
                            }
                        >
                            <i className="material-icons">add</i>
                            <span>Create New</span>
                        </button>
                    </div>
                </h1>
                <div className="items">
                    <DraggableTree
                        checkable={selectEnabled}
                        data={formatSites(sites)}
                        onSelect={items => items[0] && onItemClick(items[0])}
                        selectedKeys={selectedItems}
                        onCheck={setSelectedItems}
                        draggable={false}
                        checkStrictly
                    />
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ListSites;
