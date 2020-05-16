import './styles/TitleEditor.scss';

import React, { FunctionComponent, useState, Fragment, useEffect } from 'react';

import { error } from '../services/utils';
import cx from 'classnames';
import { getItem } from '../services/db';

interface IProps {
    siteId: string;
    postId: string;
    initValue: string;
    onSave: (s: string) => any;
}

const TitleEditor: FunctionComponent<IProps> = ({
    siteId,
    postId,
    initValue = '',
    onSave
}) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(initValue);
    const [post, setPost] = useState(null);

    useEffect(() => {
        const getData = async () => {
            const item = await getItem(siteId, postId);
            setPost(item);
        };
        getData();
    }, []);

    if (!post) {
        return null;
    }

    const save = async () => {
        if (!value.trim()) {
            error('The title must have a value');
            return;
        }

        if (!post) {
            return;
        }

        await onSave(value);
        setPost({ ...post, title: value });
        setEditing(false);
    };

    return (
        <div className={cx('title-editor', { editing })}>
            {editing ? (
                <Fragment>
                    <input
                        value={value}
                        onChange={e => setValue(e.target.value)}
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
                    <span>{post.title}</span>
                    <i
                        className="material-icons clickable"
                        onClick={() => {
                            setValue(post.title);
                            setEditing(true);
                        }}
                    >
                        edit
                    </i>
                </Fragment>
            )}
        </div>
    );
};

export default TitleEditor;
