import './styles/ThemeManager.scss';

import React, { FunctionComponent, Fragment, useState, useEffect } from 'react';
import { useHistory, useParams, Link } from 'react-router-dom';
import path from 'path';
import fs from 'fs';
import cx from 'classnames';

import Footer from './Footer';
import Header from './Header';
import { confirmation } from '../services/utils';
import { toast } from 'react-toastify';
import { modal } from './Modal';
import { shell } from 'electron';
import { getThemeListDetails } from '../services/theme';
import defaultThumbnail from '../images/defaultThemeThumbnail.png';
import { getSite, updateSite } from '../services/db';
import { configSet, configGet } from '../../common/utils';

const ThemeManager: FunctionComponent = () => {
    const { siteId } = useParams();

    const [site, setSite] = useState(null);
    const { title } = (site as ISite) || {};

    const [siteTheme, setSiteTheme] = useState(null);
    const [themeList, setThemeList] = useState([]);

    useEffect(() => {
        const getData = async () => {
            const siteRes = await getSite(siteId);
            setSite(siteRes);
            setSiteTheme(siteRes.theme);
        };
        getData();
    }, []);

    const getThemes = async (noToast?) => {
        const themes = await getThemeListDetails();
        setThemeList(themes);

        if (!noToast) {
            toast.success('Theme list refreshed!');
        }
    };

    useEffect(() => {
        getThemes(true);
    }, []);

    const history = useHistory();

    if (!site || !siteTheme) {
        return null;
    }

    const showThemeDetails = theme => {
        modal.alert(
            <Fragment>
                <p>
                    <strong>Author:</strong> {theme.author}
                </p>
                <p>
                    <strong>Homepage:</strong>{' '}
                    <a
                        href={theme.homepage}
                        target="_blank"
                        title={theme.homepage}
                        rel="noopener noreferrer"
                    >
                        {theme.homepage}
                    </a>
                </p>
                <p>
                    <strong>Parser:</strong> {theme.parser}
                </p>
                <p>
                    <strong>License:</strong> {theme.license}
                </p>
            </Fragment>,
            `${theme.title} v${theme.version}`,
            'theme-details-content'
        );
    };

    const handleSubmit = async themeName => {
        if (!themeName) {
            modal.alert('Your site must have a theme');
            return;
        }

        const updatedAt = Date.now();
        setSiteTheme(themeName);

        const updatedSite = {
            ...site,
            theme: themeName,
            updatedAt
        };

        await updateSite(siteId, {
            theme: themeName,
            updatedAt
        });

        await configSet(`sites.${siteId}.publishSuggested`, true);

        setSite(updatedSite);

        toast.success(
            'Site updated! Please publish your changes from your Dashboard'
        );
    };

    const addTheme = async () => {
        const confirmationRes = await confirmation({
            title: (
                <Fragment>
                    <p>The PRSS theme directory will be opened.</p>
                    <p>
                        You will need to add any theme files to that directory.
                    </p>
                    <p>
                        Please ensure you get themes from trusted sources, such
                        as the{' '}
                        <a
                            href="https://prss.io/themes"
                            title="https://prss.io/themes"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <u>PRSS Themes</u>
                        </a>{' '}
                        page.
                    </p>
                    <p>Continue?</p>
                </Fragment>
            )
        });

        if (confirmationRes !== 0) {
            return;
        }

        const themesDir = configGet('paths.themes');
        shell.openItem(themesDir);
    };

    return (
        <div className="ThemeManager page">
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
                            <Link to={`/sites/${siteId}/themes`}>Themes</Link>
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
                        <span>Themes</span>
                    </div>
                    <div className="right-align">
                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => getThemes()}
                        >
                            <i className="material-icons">refresh</i>
                        </button>
                    </div>
                </h1>

                <div className="theme-list">
                    {themeList.map(theme => {
                        const {
                            name,
                            title,
                            author,
                            url,
                            type,
                            themeDir
                        } = theme;
                        let image = defaultThumbnail;

                        try {
                            image =
                                'data:image/png;base64,' +
                                fs.readFileSync(
                                    path.join(themeDir, 'thumbnail.png'),
                                    { encoding: 'base64' }
                                );
                        } catch (e) {
                            console.error(e);
                        }

                        return (
                            <div
                                className={cx('theme-list-item', {
                                    'selected-theme': name === siteTheme
                                })}
                                key={`option-${name}`}
                            >
                                <div
                                    onClick={() =>
                                        name === siteTheme
                                            ? showThemeDetails(theme)
                                            : handleSubmit(name)
                                    }
                                    className="theme-list-item-image clickable"
                                    style={{
                                        backgroundImage: `url(${image})`
                                    }}
                                ></div>
                                <div className="theme-list-item-desc">
                                    <div className="theme-name">
                                        <div className="left-align">
                                            <span>{title || name}</span>
                                        </div>
                                        <div className="right-align">
                                            {['blog', 'docs'].includes(
                                                type
                                            ) && (
                                                <div className="text-tag">
                                                    {type}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {author && (
                                        <div className="theme-author">
                                            <div className="left-align">
                                                {url ? (
                                                    <a
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title={url}
                                                    >
                                                        {author}
                                                    </a>
                                                ) : (
                                                    <span>{author}</span>
                                                )}
                                            </div>
                                            <div className="right-align"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div
                        className="theme-list-item add-new-theme-btn clickable"
                        onClick={() => addTheme()}
                    >
                        <i className="material-icons">add_circle</i>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ThemeManager;
