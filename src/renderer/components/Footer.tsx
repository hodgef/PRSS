import './styles/Footer.scss';

import React, { FunctionComponent, ReactNode } from 'react';
import { getPackageJson } from '../../common/utils';
const packageJson = getPackageJson();

interface IProps {
    leftComponent?: ReactNode;
}

const Footer: FunctionComponent<IProps> = ({ leftComponent }) => {
    const { version } = packageJson;

    return (
        <footer>
            <div className="left-align">{leftComponent}</div>
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
