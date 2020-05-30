import './styles/Footer.scss';

import React, { FunctionComponent, ReactNode } from 'react';

interface IProps {
    leftComponent?: ReactNode;
}

const Footer: FunctionComponent<IProps> = ({ leftComponent }) => {
    return (
        <footer>
            <div className="left-align">{leftComponent}</div>
            <div className="right-align"></div>
        </footer>
    );
};

export default Footer;
