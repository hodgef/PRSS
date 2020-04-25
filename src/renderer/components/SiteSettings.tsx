import './styles/SiteSettings.scss';

import React, { FunctionComponent, Fragment, useState } from 'react';
import { useHistory, useParams, Link } from 'react-router-dom';

import Footer from './Footer';
import Header from './Header';
import { get, set, setInt, getInt, rem, remInt } from '../../common/utils';
import { normalizeStrict } from '../services/utils';
import { toast } from 'react-toastify';
import HTMLEditorOverlay from './HTMLEditorOverlay';
import { modal } from './Modal';
import { getThemeList } from '../services/theme';
import SiteVariablesEditorOverlay from './SiteVariablesEditorOverlay';

const SiteSettings: FunctionComponent = () => {
    const { siteId: urlSiteId } = useParams();
    const site = get(`sites.${urlSiteId}`) as ISite;
    const siteInt = getInt(`sites.${urlSiteId}`) as ISiteInternal;
    const { title, id, headHtml, footerHtml, sidebarHtml, theme, url } = site;
    const {
        hosting: { name: hostingName = 'none' }
    } = siteInt;

    const [siteTitle, setSiteTitle] = useState(title);
    const [siteId, setSiteId] = useState(id);
    const [editedSiteId, setEditedSiteId] = useState(id);
    const [siteTheme, setSiteTheme] = useState(theme);
    const [siteUrl, setSiteUrl] = useState(url);

    const [showRawHTMLEditorOverlay, setShowRawHTMLEditorOverlay] = useState(
        false
    );

    const [
        showSiteVariablesEditorOverlay,
        setShowSiteVariablesEditorOverlay
    ] = useState(false);

    const themeList = getThemeList();
    const history = useHistory();

    const handleSubmit = async () => {
        if (!editedSiteId) {
            modal.alert('Your site must have an id');
            return;
        }

        if (!siteTitle) {
            modal.alert('Your site must have a title');
            return;
        }

        if (!siteTheme) {
            modal.alert('Your site must have a theme');
            return;
        }

        if (!siteUrl) {
            modal.alert('Your site must have an URL');
            return;
        }

        const newSiteId = normalizeStrict(editedSiteId);

        const updatedSite = {
            ...site,
            id: newSiteId,
            title: siteTitle,
            theme: siteTheme,
            url: siteUrl
        };

        const updatedSiteInt = {
            ...siteInt,
            id: newSiteId,
            publishSuggested: true
        };

        if (siteId !== newSiteId) {
            await rem(`sites.${siteId}`);
            await remInt(`sites.${siteInt.id}`);
        }

        await set(`sites.${newSiteId}`, updatedSite);
        await setInt(`sites.${newSiteId}`, updatedSiteInt);

        if (siteId !== newSiteId) {
            history.replace(`/sites/${newSiteId}/settings`);
        }

        toast.success(
            'Site updated! Please publish your changes from your Dashboard'
        );
    };

    const handleRawHTMLOverlaySave = async (
        headHtml,
        footerHtml,
        sidebarHtml
    ) => {
        if (siteId) {
            await set(`sites.${siteId}.headHtml`, headHtml);
            await set(`sites.${siteId}.footerHtml`, footerHtml);
            await set(`sites.${siteId}.sidebarHtml`, sidebarHtml);
            await setInt(`sites.${siteId}.publishSuggested`, true);
            toast.success(
                'Site updated! Please publish your changes from your Dashboard'
            );
        }
    };

    return (
        <div className="CreatePost page">
            <Header
                undertitle={
                    <Fragment>
                        <div className="align-center">
                            <i className="material-icons">public</i>
                            <Link to={`/sites/${siteId}`}>{title}</Link>
                        </div>
                        <div className="align-center">
                            <i className="material-icons">
                                keyboard_arrow_right
                            </i>
                            <Link to={`/sites/${siteId}/settings`}>
                                Settings
                            </Link>
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
                        <span>Site Settings</span>
                    </div>
                </h1>

                <form className="mt-4">
                    <div className="form-group row">
                        <div className="input-group input-group-lg">
                            <label className="col-sm-2 col-form-label">
                                Site Title
                            </label>
                            <div className="col-sm-10">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={siteTitle}
                                    onChange={e => setSiteTitle(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="form-group row">
                        <div className="input-group input-group-lg">
                            <label className="col-sm-2 col-form-label">
                                Site Id
                            </label>
                            <div className="col-sm-10">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editedSiteId}
                                    onChange={e =>
                                        setEditedSiteId(e.target.value)
                                    }
                                    onBlur={() =>
                                        setEditedSiteId(
                                            normalizeStrict(editedSiteId)
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <div className="form-group row">
                        <div className="input-group input-group-lg">
                            <label className="col-sm-2 col-form-label">
                                Site Theme
                            </label>
                            <div className="col-sm-10">
                                <select
                                    className="custom-select"
                                    id="theme-selector"
                                    onChange={e => setSiteTheme(e.target.value)}
                                    value={siteTheme}
                                >
                                    {themeList.map(themeName => (
                                        <option
                                            key={`option-${themeName}`}
                                            value={themeName}
                                        >
                                            {themeName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="form-group row">
                        <div className="input-group input-group-lg">
                            <label className="col-sm-2 col-form-label">
                                Site Url
                            </label>
                            <div className="col-sm-10">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={siteUrl}
                                    onChange={e => setSiteUrl(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="form-group row">
                        <div className="input-group input-group-lg">
                            <label className="col-sm-2 col-form-label">
                                Site HTML
                            </label>
                            <div className="col-sm-10">
                                <button
                                    type="button"
                                    className="btn btn-outline-primary d-flex"
                                    onClick={() =>
                                        setShowRawHTMLEditorOverlay(true)
                                    }
                                >
                                    <span className="material-icons mr-2">
                                        code
                                    </span>
                                    <span>Add Site Raw HTML</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="form-group row">
                        <div className="input-group input-group-lg">
                            <label className="col-sm-2 col-form-label">
                                Hosting:{' '}
                                {hostingName[0].toUpperCase() +
                                    hostingName.substring(1)}
                            </label>
                            <div className="col-sm-10">
                                <button
                                    type="button"
                                    className="btn btn-outline-primary d-flex"
                                    onClick={() =>
                                        history.push(`/sites/${siteId}/hosting`)
                                    }
                                >
                                    <span className="material-icons mr-2">
                                        language
                                    </span>
                                    <span>Change hosting</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="form-group row">
                        <div className="input-group input-group-lg">
                            <label className="col-sm-2 col-form-label">
                                Site Variables
                            </label>
                            <div className="col-sm-10">
                                <button
                                    type="button"
                                    className="btn btn-outline-primary d-flex"
                                    onClick={() =>
                                        setShowSiteVariablesEditorOverlay(true)
                                    }
                                >
                                    <span className="material-icons mr-2">
                                        create
                                    </span>
                                    <span>Edit Variables</span>
                                </button>
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
            {showRawHTMLEditorOverlay && (
                <HTMLEditorOverlay
                    headDefaultValue={headHtml}
                    footerDefaultValue={footerHtml}
                    sidebarDefaultValue={sidebarHtml}
                    onSave={handleRawHTMLOverlaySave}
                    onClose={() => setShowRawHTMLEditorOverlay(false)}
                />
            )}
            {showSiteVariablesEditorOverlay && (
                <SiteVariablesEditorOverlay
                    siteId={siteId}
                    onClose={() => setShowSiteVariablesEditorOverlay(false)}
                />
            )}
        </div>
    );
};

export default SiteSettings;
