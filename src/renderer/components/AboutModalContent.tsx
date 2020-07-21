import React from 'react';
import './styles/AboutModalContent.scss';

import PRSSLogo from '../images/icon.png';

const AboutModalContent = ({ version }) => {
    return (
        <div className="content">
            <div className="row">
                <div className="col">
                    <h1>PRSS {version}</h1>
                    <div>
                        Copyright (c) 2020-present, Francisco Hodge. All rights
                        reserved.
                    </div>
                    <ul className="list">
                        <li>
                            <a
                                href="https://hodgef.com/policies/privacy"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Privacy Policy
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://hodgef.com/policies/terms"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Terms of Use
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://github.com/hodgef/PRSS/blob/master/src/renderer/json/licenses.json"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Licenses
                            </a>
                        </li>
                    </ul>
                </div>
                <div>
                    <img src={PRSSLogo} width="200" />
                </div>
            </div>
            <div className="row separator-bar mt-4 pt-4">
                <i className="material-icons mr-2">insert_emoticon</i> If you
                like PRSS, please consider&nbsp;
                <a
                    href="https://github.com/hodgef/PRSS"
                    target="_blank"
                    rel="noreferrer"
                >
                    <u>Starring it on Github!</u>
                </a>
            </div>
        </div>
    );
};

export default AboutModalContent;
