import React, { FunctionComponent } from 'react';
import PRSSLogo from '../images/PRSS.png';
import cx from 'classnames';

import './styles/Header.scss';

interface IProps {
    fixed?: boolean;
}

const Header: FunctionComponent<IProps> = ({
    fixed,
}) => (
    <header className={cx({ fixed })}>
        <img src={PRSSLogo} width="200" />
    </header>
);

export default Header;