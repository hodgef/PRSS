import './styles/CreateSite.scss';

import React, { Fragment, FunctionComponent, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { getString, configRem } from '../../common/utils';
import {
    getSampleSiteStructure,
    getSampleSiteIntStructure
} from '../services/site';
import {
    getHostingTypes,
    setupRemote,
    handleHostingFields,
    validateHostingFields,
    setSiteConfig
} from '../services/hosting';
import { error, normalizeStrict } from '../services/utils';
import Footer from './Footer';
import Header from './Header';
import Loading from './Loading';
import { modal } from './Modal';
import {
    createSite,
    deleteSite,
    deleteAllSiteItems,
    createItems
} from '../services/db';

const CreateSite: FunctionComponent = () => {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [loadingStatus, setLoadingStatus] = useState('');
    const [hosting, setHosting] = useState('github');
    const [hostingFields, setHostingFields] = useState({});
    const hostingTypes = getHostingTypes();
    const { state = {} } = useLocation();
    const history = useHistory();

    const handleSubmit = async () => {
        if (!title) {
            error('Your site must have a title');
            return;
        }

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
        const siteName = normalizeStrict(title);

        /**
         * Handle hosting fields
         * We'll save any token in the OS keychain
         */
        const parsedHosting = await handleHostingFields({
            name: hosting,
            ...hostingFields
        });

        const {
            site: siteStructure,
            items: siteItems
        } = getSampleSiteStructure();
        const siteUUID = siteStructure.uuid;

        const baseSiteDB = {
            ...siteStructure,
            name: siteName,
            title
        } as ISite;

        const baseSiteConfig = {
            ...getSampleSiteIntStructure(),
            uuid: siteStructure.uuid,
            name: siteName,
            hosting: parsedHosting
        } as ISiteInternal;

        /**
         * Save site in config
         */
        await setSiteConfig(baseSiteConfig);

        /**
         * Save site in db
         */
        await createSite(baseSiteDB);

        /**
         * Save site items in db
         */
        await createItems(siteItems);

        /**
         * Set up remote
         */
        const setupRes = await setupRemote(siteUUID, setLoadingStatus);
        if (!setupRes) {
            setLoading(false);

            /**
             * Rollback siteInt changes
             */
            await configRem(`sites.${siteUUID}`);
            await deleteSite(siteUUID);
            await deleteAllSiteItems(siteUUID);
            return;
        }

        /**
         * Go to site preview
         */
        history.push(`/sites/${siteUUID}`);
    };

    return !loading ? (
        <div className="CreateSite page">
            <Header />
            <div className="content">
                <h1 className="mb-4">
                    <div className="left-align">
                        {state.showBack && (
                            <i
                                className="material-icons clickable"
                                onClick={() => history.goBack()}
                            >
                                arrow_back
                            </i>
                        )}
                        <span>{getString('create_site_title')}</span>
                    </div>
                </h1>
                <fieldset>
                    <div className="input-group input-group-lg">
                        <input
                            type="text"
                            placeholder="Title"
                            className="form-control"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>
                </fieldset>

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

                <div className="id-info">
                    <span>ID</span>&nbsp;
                    {hosting && hostingTypes[hosting] && title ? (
                        <Fragment>{normalizeStrict(title)}</Fragment>
                    ) : (
                        'Enter title'
                    )}
                </div>

                <div className="button-container mt-2">
                    <button
                        onClick={handleSubmit}
                        type="button"
                        className="btn btn-primary btn-lg"
                    >
                        {getString('create_site_button')}
                    </button>
                </div>
            </div>

            <Footer />
        </div>
    ) : (
        <Loading title={loadingStatus} />
    );
};

export default CreateSite;
