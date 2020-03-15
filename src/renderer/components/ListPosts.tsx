import './styles/ListPosts.scss';

import React, { Fragment, FunctionComponent, useEffect, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { store } from '../../common/Store';
import { get } from '../../common/utils';
import { augmentStructure } from '../services/build';
import { deletePosts, updateSiteStructure } from '../services/hosting';
import { confirmation } from '../services/utils';
import DraggableTree from './DraggableTree';
import Footer from './Footer';
import Header from './Header';

const ListPosts: FunctionComponent = () => {
    const { siteId } = useParams();
    const { items, title, structure } = get(`sites.${siteId}`);
    const [posts, setPosts] = useState(items);
    const history = useHistory();
    const [selectEnabled, setSelectEnabled] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);

    /**
     * Check for item changes
     */
    const unsubscribe = store.onDidChange(`sites.${siteId}.items` as any, (newValue) => {
        setPosts(newValue);
    });

    const toggleSelectEnabled = () => setSelectEnabled(!selectEnabled);

    useEffect(() => () => {
        unsubscribe();
    }, []);

    const toggleSelectCheck = (id: string) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(
                selectedItems.filter(curId => curId !== id)
            );
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    }

    const deleteSelectedPosts = async (itemsToDelete?) => {
        const confRes = await confirmation({ title: 'Are you sure?' });
        if (confRes === 0) {
            const deleteSuccess = await deletePosts(siteId, itemsToDelete || selectedItems);

            if (deleteSuccess) {
                toast.success('Posts deleted!');
            } else {
                toast.error('Posts could not be deleted');
            }

            setSelectedItems([])
            setSelectEnabled(false);
        }
    }

    const renderItem = ({ title }) => ({
        title
    });

    const onStructureUpdate = (data) => {
        updateSiteStructure(siteId, data);
        toast.success('Changes saved');
    }

    return (
        <div className="ListPosts page fixed">
            <Header undertitle={(
                <Fragment>
                    <div className="align-center">
                        <i className="material-icons">public</i><Link to={`/sites/${siteId}`}>{title}</Link>
                    </div>
                    <div className="align-center">
                        <i className="material-icons">keyboard_arrow_right</i><Link to={`/sites/${siteId}/posts`}>Posts</Link>
                    </div>
                </Fragment>
            )} />
            <div className="content">
                <h1>
                    <div className="left-align">
                        <i className="material-icons clickable" onClick={() => history.goBack()}>arrow_back</i>
                        <span>Posts</span>
                    </div>
                    <div className="right-align">
                        {!!items.length && (
                            <button type="button" className="btn btn-outline-primary" onClick={toggleSelectEnabled}>Toggle Select</button>
                        )}
                        
                        {!!selectedItems.length && (
                            <button type="button" className="btn btn-outline-danger" onClick={() => deleteSelectedPosts()}>
                                <i className="material-icons">delete</i>
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => history.push(`/sites/${siteId}/posts/editor`)}
                        >
                            <i className="material-icons">add</i>
                            <span>Add New</span>
                        </button>
                    </div>
                </h1>
                <div className="items">
                    <DraggableTree
                        checkable={selectEnabled}
                        data={augmentStructure(siteId, structure, renderItem)}
                        onUpdate={onStructureUpdate}
                    />
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ListPosts;