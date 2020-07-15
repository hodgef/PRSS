import './styles/AppSettings.scss';

import React, {
    FunctionComponent,
    Fragment,
    useState,
    useEffect,
    ReactNode
} from 'react';
import { useHistory } from 'react-router-dom';

import { getString, configSet, configGet } from '../../common/utils';
import { error, confirmation } from '../services/utils';
import { modal } from './Modal';
const { app } = require('electron').remote;

interface IProps {
    setHeaderLeftComponent: (comp?: ReactNode) => void;
}

const AppSettings: FunctionComponent<IProps> = ({ setHeaderLeftComponent }) => {
    const history = useHistory();

    const [storePath, setStorePath] = useState(configGet('paths.db'));

    useEffect(() => {
        setHeaderLeftComponent(
            <Fragment>
                <div className="align-center">
                    <i className="material-icons">public</i>
                    <a onClick={() => history.push('/settings')}>Settings</a>
                </div>
            </Fragment>
        );
    }, []);

    const handleSubmit = async () => {
        if (storePath && storePath !== configGet('paths.db')) {
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
                    <div className="right-align">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleSubmit()}
                        >
                            <span className="material-icons mr-2">save</span>
                            <span>Save Changes</span>
                        </button>
                    </div>
                </h1>

                <form className="mt-4">
                    <div className="form-group row">
                        <div className="input-group input-group-lg">
                            <label
                                htmlFor="siteTitle"
                                className="col-sm-3 col-form-label"
                            >
                                Database file path (prss.db)
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
                    <div className="form-group row">
                        <div className="input-group input-group-lg">
                            <label
                                htmlFor="siteConfig"
                                className="col-sm-3 col-form-label"
                            >
                                Config file path (prss.json)
                            </label>
                            <div className="col-sm-9">
                                <input
                                    type="text"
                                    className="form-control"
                                    id="siteConfig"
                                    value={app.getPath('userData')}
                                    disabled
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AppSettings;
