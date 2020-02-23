import './styles/Loading.scss';

import React, { FunctionComponent } from 'react';

const Loading: FunctionComponent<ILoading> = ({ title, message }) => {
    return (
        <div className="Loading">
            <div className="spinner" />
            {title && <div className="title">{title}</div>}
            {message && <div className="subtitle">{message}</div>}
        </div>
    )
};

export default Loading;