import './styles/SiteSettings.scss';

import React, { FunctionComponent, Fragment, useState } from 'react';
import { useHistory, useParams, Link } from 'react-router-dom';

import Footer from './Footer';
import Header from './Header';
import { get, set, setInt } from '../../common/utils';
import { normalize } from '../services/utils';
import { toast } from 'react-toastify';
import HTMLEditorOverlay from './HTMLEditorOverlay';
import { modal } from './Modal';
import { getThemeList } from '../services/theme';

const SiteSettings: FunctionComponent = () => {
    const { siteId: urlSiteId } = useParams();
    const site = get(`sites.${urlSiteId}`) as ISite;
    const { title, id, headHtml, footerHtml, theme, url } = site;

    const [siteTitle, setSiteTitle] = useState(title);
    const [siteId, setSiteId] = useState(id);
    const [siteTheme, setSiteTheme] = useState(theme);
    const [siteUrl, setSiteUrl] = useState(url);

    const [showRawHTMLEditorOverlay, setShowRawHTMLEditorOverlay] = useState(
        false
    );

    const themeList = getThemeList();
    const history = useHistory();

    const handleSubmit = async () => {
        if (!siteId) {
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

        const updatedSite = {
            ...site,
            id: normalize(siteId),
            title: siteTitle,
            theme: siteTheme,
            url: siteUrl
        };

        await set(`sites.${siteId}`, updatedSite);
        await setInt(`sites.${siteId}.publishSuggested`, true);

        toast.success(
            'Site updated! Please publish your changes from your Dashboard'
        );
    };

    const handleRawHTMLOverlaySave = async (headHtml, footerHtml) => {
        if (siteId) {
            await set(`sites.${siteId}.headHtml`, headHtml);
            await set(`sites.${siteId}.footerHtml`, footerHtml);
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
                                    value={siteId}
                                    onChange={e => setSiteId(e.target.value)}
                                    onBlur={() => setSiteId(normalize(siteId))}
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
                                    className="btn btn-outline-primary mb-2 d-flex"
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
                    onSave={handleRawHTMLOverlaySave}
                    onClose={() => setShowRawHTMLEditorOverlay(false)}
                />
            )}
        </div>
    );
};

export default SiteSettings;
