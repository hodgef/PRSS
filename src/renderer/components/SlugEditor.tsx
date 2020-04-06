import './styles/SlugEditor.scss';

import React, { FunctionComponent, useState, Fragment } from 'react';

import { get, set, setInt } from '../../common/utils';
import { error, normalize } from '../services/utils';
import { toast } from 'react-toastify';
import cx from 'classnames';
import { getBufferItems } from '../services/build';

interface IProps {
    siteId: string;
    postIndex: number;
    url?: string;
    initValue: string;
}

const SlugEditor: FunctionComponent<IProps> = ({
    siteId,
    postIndex = -1,
    url,
    initValue = ''
}) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(initValue);
    const site = get(`sites.${siteId}`);
    const posts = get(`sites.${siteId}.items`);
    const post =
        postIndex > -1 ? get(`sites.${siteId}.items.${postIndex}`) : null;
    const bufferItems = getBufferItems(site);
    const bufferItem = post
        ? bufferItems.find(bufferItem => bufferItem.item.id === post.id)
        : null;

    const save = () => {
        if (!value.trim()) {
            error('The slug must have a value');
            return;
        }

        if (!post) {
            return;
        }

        const normalizedSlug = normalize(value);

        /**
         * Ensure slug is unique
         */
        const itemsWithSlug = posts.filter(
            item => item.slug === normalizedSlug
        );

        if (itemsWithSlug.length > 1) {
            error('You have items with the same slug');
            return;
        }

        if (itemsWithSlug.length === 1 && itemsWithSlug[0].id !== post.id) {
            error('You have an item with the same slug');
            return;
        }

        set(`sites.${siteId}.items.${postIndex}.slug`, normalizedSlug);
        setInt(`sites.${siteId}.publishSuggested`, true);

        toast.success('Slug saved');
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
                    {postIndex !== 0 ? (
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
