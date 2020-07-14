import './styles/SiteSettings.scss';

import React, {
    FunctionComponent,
    Fragment,
    useState,
    useEffect,
    ReactNode
} from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { normalizeStrict, error, appendSlash } from '../services/utils';
import { toast } from 'react-toastify';
import HTMLEditorOverlay from './HTMLEditorOverlay';
import { modal } from './Modal';
import { getThemeList } from '../services/theme';
import SiteVariablesEditorOverlay from './SiteVariablesEditorOverlay';
import { configGet, configSet } from '../../common/utils';
import { getSite, updateSite } from '../services/db';
import { shell } from 'electron';
import path from 'path';
import fs from 'fs';

interface IProps {
    setHeaderLeftComponent: (comp?: ReactNode) => void;
}

const SiteSettings: FunctionComponent<IProps> = ({
    setHeaderLeftComponent
}) => {
    const { siteId } = useParams();

    const siteInt = configGet(`sites.${siteId}`) as ISiteInternal;
    const {
        hosting: { name: hostingName = 'none' }
    } = siteInt;

    const [site, setSite] = useState(null);
    const { title, headHtml, footerHtml, sidebarHtml } = (site as ISite) || {};

    const [siteTitle, setSiteTitle] = useState('');
    const [editedSiteName, setEditedSiteName] = useState('');
    const [siteTheme, setSiteTheme] = useState('');
    const [siteUrl, setSiteUrl] = useState('');

    const [showRawHTMLEditorOverlay, setShowRawHTMLEditorOverlay] = useState(
        false
    );

    const [
        showSiteVariablesEditorOverlay,
        setShowSiteVariablesEditorOverlay
    ] = useState(false);

    const [themeList, setThemeList] = useState(null);
    const history = useHistory();

    useEffect(() => {
        if (!title) {
            return;
        }
        setHeaderLeftComponent(
            <Fragment>
                <div className="align-center">
                    <i className="material-icons">public</i>
                    <a onClick={() => history.push(`/sites/${siteId}`)}>
                        {title}
                    </a>
                </div>
                <div className="align-center">
                    <i className="material-icons">keyboard_arrow_right</i>
                    <a
                        onClick={() =>
                            history.push(`/sites/${siteId}/settings`)
                        }
                    >
                        Settings
                    </a>
                </div>
            </Fragment>
        );
    }, [title]);

    useEffect(() => {
        const getData = async () => {
            const siteRes = await getSite(siteId);
            const { title, name, theme, url } = (siteRes as ISite) || {};
            setSite(siteRes);
            setSiteTitle(title);
            setEditedSiteName(name);
            setSiteTheme(theme);
            setSiteUrl(url);

            setThemeList(await getThemeList());
        };
        getData();
    }, []);

    if (!site || !themeList) {
        return null;
    }

    const openPublicDir = async () => {
        const { name: siteName } = site;
        const publicDir = path.join(configGet('paths.public'), siteName);

        if (fs.existsSync(publicDir)) {
            shell.openItem(publicDir);
        } else {
            error(
                'The directory does not exist yet. Please preview or deploy your site'
            );
        }
    };

    const handleSubmit = async () => {
        if (!editedSiteName) {
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

        const updatedAt = Date.now();
        const newSiteName = normalizeStrict(editedSiteName);

        const updatedSite = {
            ...site,
            name: newSiteName,
            title: siteTitle,
            theme: siteTheme,
            url: siteUrl,
            updatedAt
        };

        const updatedSiteInt = {
            ...siteInt,
            publishSuggested: true
        };

        /**
         * Update site updatedAt
         */
        await updateSite(siteId, {
            name: newSiteName,
            title: siteTitle,
            theme: siteTheme,
            url: siteUrl,
            updatedAt
        });

        await configSet(`sites.${siteId}`, updatedSiteInt);

        setSite(updatedSite);

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
            const updatedAt = Date.now();

            const updatedSite = {
                ...site,
                headHtml,
                footerHtml,
                sidebarHtml,
                updatedAt
            };

            /**
             *  Update item
             */
            await updateSite(siteId, {
                headHtml,
                footerHtml,
                sidebarHtml,
                updatedAt
            });

            await configSet(`sites.${siteId}.publishSuggested`, true);

            setSite(updatedSite);

            toast.success(
                'Site updated! Please publish your changes from your Dashboard'
            );
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
                        <span>Site Settings</span>
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
                                Site Name
                            </label>
                            <div className="col-sm-10">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editedSiteName}
                                    onChange={e =>
                                        setEditedSiteName(e.target.value)
                                    }
                                    onBlur={() =>
                                        setEditedSiteName(
                                            normalizeStrict(editedSiteName)
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
                                    onBlur={e =>
                                        setSiteUrl(appendSlash(e.target.value))
                                    }
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
                    <div className="form-group row">
                        <div className="input-group input-group-lg">
                            <label className="col-sm-2 col-form-label">
                                Public Folder
                            </label>
                            <div className="col-sm-10">
                                <button
                                    type="button"
                                    className="btn btn-outline-primary d-flex"
                                    onClick={() => openPublicDir()}
                                >
                                    <span className="material-icons mr-2">
                                        folder
                                    </span>
                                    <span>Open Public Dir</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
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
