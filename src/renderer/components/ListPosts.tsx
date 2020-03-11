import './styles/ListPosts.scss';

import React, { Fragment, FunctionComponent, useEffect, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { store } from '../../common/Store';
import { get } from '../../common/utils';
import { deletePosts } from '../services/blog';
import { confirmation } from '../services/utils';
import Footer from './Footer';
import Header from './Header';

const ListPosts: FunctionComponent = () => {
    const { siteId } = useParams();
    const { items, title } = get(`sites.${siteId}`);
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

    const deleteSelectedPosts = async (itemsToDelete) => {
        if (items.length === 1) {
            toast.error('Your site needs at least one post. Please create a new post, then delete this one.');
            return;
        }

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
                            <button type="button" className="btn btn-outline-danger" onClick={deleteSelectedPosts}>
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
                    <ul>
                        {posts.map(({ id, title }) => {
                            return (
                                <li key={id} onClick={() => history.push(`/sites/${siteId}/posts/editor/${id}`)}>
                                    <div className="left-align">
                                        {selectEnabled && (
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input position-static"
                                                    type="checkbox"
                                                    onChange={() => toggleSelectCheck(id)}
                                                />
                                            </div>
                                        )}
                                        <div className="site-title clickable">{title}</div>
                                    </div>
                                    <div className="right-align">
                                        <i className="material-icons clickable mr-3">edit</i>
                                        <i
                                            className="material-icons clickable"
                                            onClick={() => deleteSelectedPosts([ id ])}
                                        >delete</i>
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