import './styles/ListPosts.scss';

import React, { Fragment, FunctionComponent, useEffect, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { store } from '../../common/Store';
import { get } from '../../common/utils';
import { formatStructure } from '../services/build';
import { deletePosts, updateSiteStructure } from '../services/hosting';
import DraggableTree from './DraggableTree';
import Footer from './Footer';
import Header from './Header';

const ListPosts: FunctionComponent = () => {
    const { siteId } = useParams();
    const { items, title, structure } = get(`sites.${siteId}`);
    const [structureState, setStructureState] = useState(structure);
    const history = useHistory();
    const [selectEnabled, setSelectEnabled] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);

    /**
     * Check for item changes
     */
    const unsubscribe = store.onDidChange(
        `sites.${siteId}.structure` as any,
        newValue => {
            console.log('CALLED', newValue);
            setStructureState([...newValue]);
        }
    );

    useEffect(
        () => () => {
            unsubscribe();
        },
        []
    );

    const toggleSelectEnabled = () => setSelectEnabled(!selectEnabled);

    const deleteSelectedPosts = async () => {
        const deleteSuccess = await deletePosts(siteId, selectedItems);

        if (deleteSuccess) {
            toast.success('Posts deleted!');
            setSelectedItems([]);
            setSelectEnabled(false);
        } else {
            toast.error('No deletion made');
        }
    };

    const onItemClick = itemId => {
        history.push(`/sites/${siteId}/posts/editor/${itemId}`);
    };

    const renderItem = ({ title }) => ({
        title
    });

    const onStructureUpdate = data => {
        console.log('STRUCTURE UPDATE', data);
        const updatedStructure = formatStructure(siteId, data);
        updateSiteStructure(siteId, updatedStructure);
        toast.success('Changes saved');
    };

    return (
        <div className="ListPosts page fixed">
            <Header
                undertitle={
                    <Fragment>
                        <div className="align-center">
                            <i className="material-icons">public</i>
                            <Link to={`/sites/${siteId}`}>{title}</Link>
                        </div>
                        <div className="align-center">
                            <i className="material-icons">
                                keyboard_arrow_right
                            </i>
                            <Link to={`/sites/${siteId}/posts`}>Posts</Link>
                        </div>
                    </Fragment>
                }
            />
            <div className="content">
                <h1>
                    <div className="left-align">
                        <i
                            className="material-icons clickable"
                            onClick={() => history.goBack()}
                        >
                            arrow_back
                        </i>
                        <span>Posts</span>
                    </div>
                    <div className="right-align">
                        {!!items.length && (
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
                                onClick={() => deleteSelectedPosts()}
                            >
                                <i className="material-icons">delete</i>
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() =>
                                history.push(`/sites/${siteId}/posts/editor`)
                            }
                        >
                            <i className="material-icons">add</i>
                            <span>Add New</span>
                        </button>
                    </div>
                </h1>
                <div className="items">
                    <DraggableTree
                        checkable={selectEnabled}
                        data={formatStructure(
                            siteId,
                            structureState,
                            renderItem
                        )}
                        onUpdate={onStructureUpdate}
                        onSelect={items => items[0] && onItemClick(items[0])}
                        selectedKeys={selectedItems}
                        onCheck={setSelectedItems}
                        checkStrictly
                    />
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ListPosts;
