import './styles/Footer.scss';

import React, { FunctionComponent } from 'react';
import { packageJson } from '../../common/Store';

const Footer: FunctionComponent = () => {
    const { version } = packageJson;

    return (
        <footer>
            <div className="left-align"></div>
            <div className="right-align">
                <span
                    className="text-tag version-tag"
                    title={`Version ${version}`}
                >
                    v{version}
                </span>
            </div>
        </footer>
    );
};

export default Footer;
