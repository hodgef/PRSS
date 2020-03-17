import './styles/Header.scss';

import cx from 'classnames';
import React, { FunctionComponent, ReactNode } from 'react';

import PRSSLogo from '../images/PRSS.png';

interface IProps {
    undertitle?: ReactNode;
}

const Header: FunctionComponent<IProps> = ({ undertitle }) => (
    <header className={cx({ 'has-undertitle': undertitle })}>
        <div className="header-cont">
            <img src={PRSSLogo} width="150" />
        </div>
        {undertitle && <div className="header-subtitle">{undertitle}</div>}
    </header>
);

export default Header;
