import './styles/Header.scss';

import cx from 'classnames';
import React, { FunctionComponent } from 'react';

import PRSSLogo from '../images/PRSS.png';

interface IProps {
    fixed?: boolean;
    subtitle?: string;
}

const Header: FunctionComponent<IProps> = ({
    fixed,
    subtitle
}) => (
    <header className={cx({ fixed })}>
        <div className="header-cont">
            <img src={PRSSLogo} width="150" />
        </div>
        {subtitle && (
            <div className="header-subtitle">
                <i className="material-icons">public</i><span>{subtitle}</span>
            </div>
        )}
    </header>
);

export default Header;