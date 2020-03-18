import './styles/Loading.scss';

import cx from 'classnames';
import React, { FunctionComponent } from 'react';

interface ILoading {
    title?: string;
    message?: string;
    small?: boolean;
    classNames?: string;
}

const Loading: FunctionComponent<ILoading> = ({
    title,
    message,
    small,
    classNames = ''
}) => {
    return (
        <div
            className={cx('Loading', classNames, {
                'loading-small': small
            })}
        >
            <div className="spinner" />
            {title && <div className="title">{title}</div>}
            {message && <div className="subtitle">{message}</div>}
        </div>
    );
};

export default Loading;
