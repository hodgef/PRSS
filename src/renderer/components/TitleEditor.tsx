import './styles/TitleEditor.scss';

import React, { FunctionComponent, useState, Fragment } from 'react';

import { get, set } from '../../common/utils';
import { error } from '../services/utils';
import { toast } from 'react-toastify';
import cx from 'classnames';

interface IProps {
    siteId: string;
    postIndex: number;
    initValue: string;
}

const TitleEditor: FunctionComponent<IProps> = ({
    siteId,
    postIndex = -1,
    initValue = ''
}) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(initValue);
    const post =
        postIndex > -1 ? get(`sites.${siteId}.items.${postIndex}`) : null;

    const save = () => {
        if (!value.trim()) {
            error('The title must have a value');
            return;
        }

        if (!post) {
            return;
        }

        set(`sites.${siteId}.items.${postIndex}.title`, value);

        toast.success('Title saved');
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
