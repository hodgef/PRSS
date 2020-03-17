import './styles/Footer.scss';

import React, { FunctionComponent } from 'react';

import { getString } from '../../common/utils';

const Footer: FunctionComponent = () => (
    <footer>
        <div className="credit">{getString('footer_notice')}</div>
    </footer>
);

export default Footer;
