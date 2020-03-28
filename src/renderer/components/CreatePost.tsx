import './styles/CreatePost.scss';

import React, { FunctionComponent, Fragment, useState } from 'react';
import { useHistory, useParams, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import Footer from './Footer';
import Header from './Header';
import { get, set } from '../../common/utils';
import { normalize, error } from '../services/utils';
import { formatStructure } from '../services/build';
import { toast } from 'react-toastify';

const CreatePost: FunctionComponent = () => {
    const { siteId } = useParams();
    const { items, title, structure, hosting } = get(`sites.${siteId}`);
    const [postTitle, setPostTitle] = useState('');
    const [postSlug, setPostSlug] = useState('');
    const [postParent, setPostParent] = useState('');
    const history = useHistory();

    const formattedStructure = formatStructure(
        siteId,
        structure,
        ({ title }) => ({ title })
    );

    const formatStructureOptions = (node, options = [], parents = []) => {
        const indent = parents.map(() => '--').join('') + ' ';

        options.push(
            <option value={node.key}>
                {indent}
                {node.title}
            </option>
        );

        if (node.children) {
            node.children.forEach(childrenNode => {
                formatStructureOptions(childrenNode, options, [
                    ...parents,
                    node.key
                ]);
            });
        }

        return options;
    };

    const formattedStructureOptions = formatStructureOptions(
        formattedStructure[0]
    );

    const insertStructureChildren = (node, item, postId) => {
        if (node.key === postId) {
            const newChildren = node.children || [];
            newChildren.push(item);
            node.children = newChildren;
        } else {
            node.children = node.children.map(nodeChild =>
                insertStructureChildren(nodeChild, item, postId)
            );
        }

        return node;
    };

    const handleSubmit = () => {
        if (!postTitle) {
            error('You must provide a title');
            return;
        }

        const postId = uuidv4();

        const item = {
            id: postId,
            title: postTitle,
            slug: normalize(postSlug || postTitle),
            content: '',
            template: 'post',
            parser: 'react',
            updatedAt: null,
            createdAt: Date.now()
        };

        const structureItem = {
            key: postId,
            children: []
        };

        /**
         * Insert post in items
         */
        items.push(item);
        const newItems = [...items];

        /**
         * Insert post in structure
         */
        let newStructure = structure;

        if (!postParent) {
            newStructure[0].children.push(structureItem);
        } else {
            newStructure = newStructure.map(node =>
                insertStructureChildren(node, structureItem, postParent)
            );
        }

        /**
         * Saving
         */
        set(`sites.${siteId}.items`, newItems);
        set(`sites.${siteId}.structure`, newStructure);

        history.push(`/sites/${siteId}/posts/editor/${postId}`);
        toast.success('Post Created! You can now edit its content');
    };

    return (
        <div className="CreatePost page">
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
                        <div className="align-center">
                            <i className="material-icons">
                                keyboard_arrow_right
                            </i>
                            <Link to={`/sites/${siteId}/posts/create`}>
                                Create Post
                            </Link>
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
                        <span>Create Post</span>
                    </div>
                </h1>

                <div className="form-group">
                    <input
                        className="form-control form-control-lg mb-2"
                        type="text"
                        placeholder="Title"
                        value={postTitle}
                        onChange={e => setPostTitle(e.target.value)}
                    ></input>
                    <input
                        className="form-control form-control-lg mb-2"
                        type="text"
                        placeholder="Slug (optional)"
                        value={postSlug}
                        onChange={e => setPostSlug(e.target.value)}
                        onBlur={e => setPostSlug(normalize(e.target.value))}
                    ></input>
                    <select
                        className="form-control form-control-lg mb-3"
                        value={postParent}
                        onChange={e => setPostParent(e.target.value)}
                    >
                        <option value="">
                            Select a parent post (optional)
                        </option>
                        {formattedStructureOptions}
                    </select>
                    <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        onClick={() => handleSubmit()}
                    >
                        Continue
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default CreatePost;
