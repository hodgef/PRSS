import './styles/SiteHostingSwitcher.scss';

import React, { Fragment, FunctionComponent, useState, useEffect } from 'react';
import { useHistory, useParams, Link } from 'react-router-dom';

import { getString, configGet, configSet } from '../../common/utils';
import {
    getHostingTypes,
    setupRemote,
    handleHostingFields,
    validateHostingFields
} from '../services/hosting';
import { error } from '../services/utils';
import Footer from './Footer';
import Header from './Header';
import Loading from './Loading';
import { modal } from './Modal';
import { toast } from 'react-toastify';
import { getSite } from '../services/db';

const SiteHostingSwitcher: FunctionComponent = () => {
    const { siteId } = useParams();

    const [site, setSite] = useState(null);

    const [loading, setLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [hosting, setHosting] = useState('github');
    const [hostingFields, setHostingFields] = useState({});
    const hostingTypes = getHostingTypes();
    const history = useHistory();

    useEffect(() => {
        const getData = async () => {
            const siteRes = await getSite(siteId);
            setSite(siteRes);
        };
        getData();
    }, []);

    if (!site) {
        return null;
    }

    const handleSubmit = async () => {
        if (!hostingTypes[hosting]) {
            error(
                'The specified hosting is not supported. Please try again later'
            );
            return;
        }

        const siteInt = await configGet(`sites.${siteId}`);

        const isValid = validateHostingFields(
            hostingFields,
            hostingTypes[hosting].fields
        );

        if (!isValid) {
            error(getString('error_fill_fields'));
            return;
        }

        setLoading(true);

        /**
         * Handle hosting fields
         * We'll save any token in the OS keychain
         */
        const parsedHosting = await handleHostingFields({
            name: hosting,
            ...hostingFields
        });

        const baseSiteInternal = {
            ...siteInt,
            hosting: parsedHosting
        } as ISiteInternal;

        await configSet(`sites.${siteId}`, baseSiteInternal);

        /**
         * Set up remote
         */
        const newSite = await setupRemote(siteId, setLoadingStatus);
        if (!newSite) {
            setLoading(false);

            /**
             * Rollback siteInt changes
             */
            await configSet(`sites.${siteId}`, siteInt);

            return;
        }

        toast.success('Hosting saved!');

        /**
         * Go to site preview
         */
        history.push(`/sites/${siteId}/settings`);
    };

    return !loading ? (
        <div className="SiteHostingSwitcher page">
            <Header
                undertitle={
                    <Fragment>
                        <div className="align-center">
                            <i className="material-icons">public</i>
                            <Link to={`/sites/${siteId}`}>{site.title}</Link>
                        </div>
                        <div className="align-center">
                            <i className="material-icons">
                                keyboard_arrow_right
                            </i>
                            <Link to={`/sites/${siteId}/hosting`}>
                                Change hosting
                            </Link>
                        </div>
                    </Fragment>
                }
            />
            <div className="content">
                <h1 className="mb-4">
                    <div className="left-align">
                        <i
                            className="material-icons clickable"
                            onClick={() => history.goBack()}
                        >
                            arrow_back
                        </i>
                        <span>{getString('hosting_switch_title')}</span>
                    </div>
                </h1>

                <div className="input-group input-group-lg">
                    <div className="input-group-prepend">
                        <label className="input-group-text">
                            {getString('hosting_label')}
                        </label>
                    </div>
                    <select
                        className="custom-select"
                        onChange={e => setHosting(e.target.value)}
                    >
                        {Object.keys(hostingTypes).map(key => {
                            const { title } = hostingTypes[key];

                            return (
                                <option key={`hosting-${key}`} value={key}>
                                    {title}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {hosting &&
                    hostingTypes[hosting].fields &&
                    hostingTypes[hosting].fields.map(
                        ({ name, title, type, description }) => (
                            <div
                                className="input-group input-group-lg"
                                key={`${name}-fields`}
                            >
                                <input
                                    type={type}
                                    placeholder={title}
                                    className="form-control"
                                    value={hostingFields[name] || ''}
                                    onChange={e =>
                                        setHostingFields({
                                            ...hostingFields,
                                            ...{ [name]: e.target.value }
                                        })
                                    }
                                />
                                {description && (
                                    <div
                                        className="description-icon clickable"
                                        onClick={() =>
                                            modal.alert(
                                                description,
                                                null,
                                                'hosting-field-desc'
                                            )
                                        }
                                    >
                                        <span className="material-icons mr-2">
                                            info
                                        </span>
                                    </div>
                                )}
                            </div>
                        )
                    )}

                <div className="button-container mt-2">
                    <button
                        onClick={handleSubmit}
                        type="button"
                        className="btn btn-primary btn-lg"
                    >
                        {getString('save_button')}
                    </button>
                </div>
            </div>

            <Footer />
        </div>
    ) : (
        <Loading title={loadingStatus} />
    );
};

export default SiteHostingSwitcher;
