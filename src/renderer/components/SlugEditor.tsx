import './styles/SlugEditor.scss';

import React, { FunctionComponent, useState, Fragment, useEffect } from 'react';

import { getString } from '../../common/utils';
import { error, normalize } from '../services/utils';
import cx from 'classnames';
import { getBufferItems } from '../services/build';
import { isValidSlug } from '../services/hosting';
import { modal } from './Modal';
import { getSite, getItems } from '../services/db';

interface IProps {
    siteId: string;
    postId: string;
    url?: string;
    initValue: string;
    onSave: (s: string) => any;
}

const SlugEditor: FunctionComponent<IProps> = ({
    siteId,
    postId,
    url,
    initValue = '',
    onSave
}) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(initValue);

    const [site, setSite] = useState(null);
    const [items, setItems] = useState(null);
    const [post, setPost] = useState(null);
    const [bufferItems, setBufferItems] = useState(null);

    useEffect(() => {
        const getData = async () => {
            const siteRes = await getSite(siteId);
            const itemsRes = await getItems(siteId);
            setSite(siteRes);
            setItems(itemsRes);
            setPost(itemsRes.find(item => item.uuid === postId));
            const bufferItems = await getBufferItems(siteRes);
            setBufferItems(bufferItems);
        };
        getData();
    }, []);

    const bufferItem = bufferItems
        ? bufferItems.find(bufferItem => bufferItem.item.uuid === post.uuid)
        : null;

    if (!site || !items || !post || !bufferItem) {
        return null;
    }

    const save = async () => {
        if (!value.trim()) {
            error('The slug must have a value');
            return;
        }

        if (!post) {
            return;
        }

        const normalizedSlug = normalize(value);

        if (!(await isValidSlug(normalizedSlug, siteId, post.uuid))) {
            modal.alert(getString('error_invalid_slug'));
            return;
        }

        /**
         * Ensure slug is unique
         */
        const itemsWithSlug = items.filter(
            item => item.slug === normalizedSlug
        );

        if (itemsWithSlug.length > 1) {
            error('You have items with the same slug');
            return;
        }

        if (itemsWithSlug.length === 1 && itemsWithSlug[0].uuid !== post.uuid) {
            error('You have an item with the same slug');
            return;
        }

        await onSave(normalizedSlug);
        setPost({ ...post, slug: normalizedSlug });
        setEditing(false);
    };

    return (
        <div className={cx('slug-editor', { editing })}>
            {editing ? (
                <Fragment>
                    <input
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        className="mr-2"
                    />
                    <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => setEditing(false)}
                    >
                        <i className="material-icons">clear</i>
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => save()}
                    >
                        <i className="material-icons">check</i>
                    </button>
                </Fragment>
            ) : (
                <Fragment>
                    {bufferItem.path !== '/' ? (
                        <Fragment>
                            <a
                                href={url + bufferItem.path.substring(1) + '/'}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={url + bufferItem.path.substring(1) + '/'}
                                className="mr-2"
                            >
                                {post.slug}
                            </a>

                            <i
                                className="material-icons clickable"
                                onClick={() => {
                                    setValue(post.slug);
                                    setEditing(true);
                                }}
                            >
                                edit
                            </i>
                        </Fragment>
                    ) : (
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={url}
                            className="mr-2 font-italic"
                        >
                            Site Index
                        </a>
                    )}
                </Fragment>
            )}
        </div>
    );
};

export default SlugEditor;
