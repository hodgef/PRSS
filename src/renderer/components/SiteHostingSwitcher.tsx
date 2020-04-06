import './styles/SiteHostingSwitcher.scss';

import React, { Fragment, FunctionComponent, useState } from 'react';
import { useHistory, useParams, Link } from 'react-router-dom';

import { getString, get, getInt } from '../../common/utils';
import {
    getHostingTypes,
    setSite,
    setupRemote,
    handleHostingFields,
    setSiteInternal,
    validateHostingFields
} from '../services/hosting';
import { error } from '../services/utils';
import Footer from './Footer';
import Header from './Header';
import Loading from './Loading';
import { modal } from './Modal';
import { toast } from 'react-toastify';

const SiteHostingSwitcher: FunctionComponent = () => {
    const { siteId } = useParams();
    const site = get(`sites.${siteId}`);
    const siteInt = getInt(`sites.${siteId}`);

    const [loading, setLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [hosting, setHosting] = useState('github');
    const [hostingFields, setHostingFields] = useState({});
    const hostingTypes = getHostingTypes();
    const history = useHistory();

    const handleSubmit = async () => {
        if (!hostingTypes[hosting]) {
            error(
                'The specified hosting is not supported. Please try again later'
            );
            return;
        }

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

        await setSiteInternal(baseSiteInternal);

        /**
         * Set up remote
         */
        const newSite = await setupRemote(site, setLoadingStatus);
        if (!newSite) {
            setLoading(false);

            /**
             * Rollback siteInt changes
             */
            await setSiteInternal(siteInt);

            return;
        }

        /**
         * Save site
         */
        setSite(site);

        toast.success('Hosting saved!');

        /**
         * Go to site preview
         */
        history.push(`/sites/${site.id}/settings`);
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
