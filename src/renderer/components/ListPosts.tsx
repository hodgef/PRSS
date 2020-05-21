import './styles/ListPosts.scss';

import React, { Fragment, FunctionComponent, useEffect, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    walkStructure,
    findInStructureCondition,
    findParentInStructure
} from '../services/build';
import {
    deletePosts,
    updateSiteStructure,
    buildAndDeploy,
    clonePosts
} from '../services/hosting';
import DraggableTree from './DraggableTree';
import Footer from './Footer';
import Header from './Header';
import Loading from './Loading';
import { getSite, getItems } from '../services/db';
import { configGet, configSet } from '../../common/utils';
import { error } from '../services/utils';

const ListPosts: FunctionComponent = () => {
    const { siteId } = useParams();

    const [site, setSite] = useState(null);
    const [items, setItems] = useState(null);
    const { title } = (site as ISite) || {};

    const { hosting, publishSuggested } = configGet(`sites.${siteId}`);
    const [structureState, setStructureState] = useState(null);
    const history = useHistory();
    const [selectEnabled, setSelectEnabled] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [showPublishButton] = useState(publishSuggested);

    const renderItem = ({ title }) => ({
        title
    });

    useEffect(() => {
        const getData = async () => {
            const siteRes = await getSite(siteId);
            const itemsRes = await getItems(siteId);
            const draggableRes = await walkStructure(
                siteId,
                siteRes.structure,
                renderItem
            );
            setSite(siteRes);
            setItems(itemsRes);
            setStructureState(draggableRes);
        };
        getData();
    }, []);

    if (!site || !items || !structureState) {
        return null;
    }

    const toggleSelectEnabled = () => setSelectEnabled(!selectEnabled);

    const deleteSelectedPosts = async () => {
        const { structure, items } = await deletePosts(siteId, selectedItems);

        if (structure && items) {
            toast.success('Posts deleted!');
            setSelectedItems([]);
            setSelectEnabled(false);
            setItems(items);

            const draggableRes = await walkStructure(
                siteId,
                structure,
                renderItem
            );
            setStructureState(draggableRes);
        } else {
            toast.error('No deletion made');
        }
    };

    const cloneSelectedPosts = async () => {
        const { updatedStructure, updatedItems } = await clonePosts(
            siteId,
            selectedItems
        );

        if (updatedStructure && updatedItems) {
            toast.success('Posts cloned!');
            setSelectedItems([]);
            setSelectEnabled(false);
            setItems(updatedItems);

            const draggableRes = await walkStructure(
                siteId,
                updatedStructure,
                renderItem
            );
            setStructureState(draggableRes);
        } else {
            toast.error('Action cancelled');
        }
    };

    const onItemClick = itemId => {
        history.push(`/sites/${siteId}/posts/editor/${itemId}`);
    };

    const onStructureUpdate = async data => {
        const updatedStructure = await walkStructure(siteId, data);
        updateSiteStructure(siteId, updatedStructure);
        setStructureState(
            await walkStructure(siteId, updatedStructure, renderItem)
        );
        toast.success('Changes saved');
    };

    const publishSite = async () => {
        setLoading(true);

        const site = await getSite(siteId);
        const publishRes = await buildAndDeploy(site, setLoadingStatus);
        configSet(`sites.${siteId}.publishSuggested`, false);
        toast.success('Publish complete');
        if (typeof publishRes === 'object') {
            if (publishRes.type === 'redirect') {
                history.push(publishRes.value);
            }
        }
        setLoading(false);
    };

    /**
     * Ensure unique slug wherever item is dropped.
     * Cancel if item with same slug exists at drop point.
     */
    const onDropItemCheck = async (newData, draggedNodeUUID) => {
        const draggedItem = items.find(item => item.uuid === draggedNodeUUID);
        const draggedItemParent = findParentInStructure(
            draggedNodeUUID,
            structureState
        );

        const hasSlugDuplicates = findInStructureCondition(newData, node => {
            const nodeItem = items.find(item => item.uuid === node.key);
            const nodeParent =
                findParentInStructure(node.key, structureState) || {};

            const hasSameSlug = nodeItem.slug === draggedItem.slug;
            const isSameItem = nodeItem.uuid === draggedItem.uuid;
            const hasSameParent = draggedItemParent.key === nodeParent.key;

            const duplicatesAtSameLevel =
                !isSameItem && hasSameParent && hasSameSlug;

            return duplicatesAtSameLevel;
        });

        if (hasSlugDuplicates) {
            error(
                `There is already an item with the same slug ("${draggedItem.slug}") at this position. Please change the slug or drop elsewhere`
            );
        }

        return hasSlugDuplicates;
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
                            <Fragment>
                                <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={() => cloneSelectedPosts()}
                                    title="Clone Selected Posts"
                                >
                                    <i className="material-icons">file_copy</i>
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={() => deleteSelectedPosts()}
                                    title="Delete Selected Posts"
                                >
                                    <i className="material-icons">delete</i>
                                </button>
                            </Fragment>
                        )}
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() =>
                                history.push(`/sites/${siteId}/posts/create`)
                            }
                        >
                            <i className="material-icons">add</i>
                            <span>Add New</span>
                        </button>
                        {showPublishButton && hosting.name !== 'none' && (
                            <button
                                type="button"
                                className="btn btn-outline-success"
                                onClick={() => publishSite()}
                            >
                                <i className="material-icons">publish</i>
                                <span>Publish Changes</span>
                            </button>
                        )}
                    </div>
                </h1>
                <div className="items">
                    <DraggableTree
                        checkable={selectEnabled}
                        data={structureState}
                        onUpdate={data => {
                            onStructureUpdate(data);
                        }}
                        onDropCheck={onDropItemCheck}
                        onSelect={items => items[0] && onItemClick(items[0])}
                        selectedKeys={selectedItems}
                        onCheck={setSelectedItems}
                        checkStrictly
                    />
                </div>
            </div>
            <Footer />
            {loading && <Loading classNames="block" title={loadingStatus} />}
        </div>
    );
};

export default ListPosts;
