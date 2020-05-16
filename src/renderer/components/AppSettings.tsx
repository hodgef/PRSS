import './styles/AppSettings.scss';

import React, { FunctionComponent, Fragment, useState } from 'react';
import { useHistory, Link } from 'react-router-dom';

import Footer from './Footer';
import Header from './Header';
import { getString, configSet, configGet } from '../../common/utils';
import { error, confirmation } from '../services/utils';
import { modal } from './Modal';
const { app } = require('electron').remote;

const AppSettings: FunctionComponent = () => {
    const history = useHistory();

    const [storePath, setStorePath] = useState(configGet('paths.db'));

    const handleSubmit = async () => {
        if (storePath) {
            const confirmationRes = await confirmation({
                title: (
                    <Fragment>
                        <p>You have modified the database file path.</p>
                        <p>
                            Please ensure you have copied or moved the file to
                            its new location.
                        </p>
                        <p>PRSS will be restarted.</p>
                        <p>Continue?</p>
                    </Fragment>
                )
            });

            if (confirmationRes !== 0) {
                error(getString('action_cancelled'));
                return;
            }

            await configSet('paths.db', storePath);

            modal.alert(
                'Config path changed! PRSS will restart in 3 seconds...'
            );

            setTimeout(() => {
                app.relaunch();
                app.exit();
            }, 3000);
        }
    };

    return (
        <div className="CreatePost page">
            <Header
                undertitle={
                    <Fragment>
                        <div className="align-center">
                            <i className="material-icons">public</i>
                            <Link to={'/settings'}>Settings</Link>
                        </div>
                    </Fragment>
                }
            />
            <div className="content">
                <h1>
                    <div className="left-align">
                        <i
                            className="material-icons clickable"
                            onClick={() => history.goBack()}
                        >
                            arrow_back
                        </i>
                        <span>Settings</span>
                    </div>
                </h1>

                <form className="mt-4">
                    <div className="form-group row">
                        <div className="input-group input-group-lg">
                            <label
                                htmlFor="siteTitle"
                                className="col-sm-3 col-form-label"
                            >
                                Database directory
                            </label>
                            <div className="col-sm-9">
                                <input
                                    type="text"
                                    className="form-control"
                                    id="siteTitle"
                                    value={storePath || app.getPath('userData')}
                                    onChange={e => setStorePath(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </form>

                <div className="form-group mt-4">
                    <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        onClick={() => handleSubmit()}
                    >
                        Save Settings
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default AppSettings;
