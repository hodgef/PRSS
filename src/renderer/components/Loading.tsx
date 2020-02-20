import './styles/Loading.scss';

import React, { FunctionComponent } from 'react';

const Loading: FunctionComponent<ILoading> = ({ title, message }) => {
    console.log(title, message);
    return (
        <div className="loading">
            <div className="spinner" />
            {title && <div className="title">{title}</div>}
            {message && <div className="title">{message}</div>}
        </div>
    )
};

export default Loading;