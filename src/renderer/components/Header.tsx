import './styles/Header.scss';

import cx from 'classnames';
import React, { FunctionComponent, ReactNode } from 'react';

import PRSSLogo from '../images/PRSS.png';

interface IProps {
    fixed?: boolean;
    undertitle?: ReactNode;
}

const Header: FunctionComponent<IProps> = ({
    fixed,
    undertitle
}) => (
    <header className={cx({ fixed })}>
        <div className="header-cont">
            <img src={PRSSLogo} width="150" />
        </div>
        {undertitle && (
            <div className="header-subtitle">
                {undertitle}
            </div>
        )}
    </header>
);

export default Header;