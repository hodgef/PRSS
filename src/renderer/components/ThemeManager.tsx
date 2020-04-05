import './styles/ThemeManager.scss';

import React, { FunctionComponent, Fragment, useState, useEffect } from 'react';
import { useHistory, useParams, Link } from 'react-router-dom';
import path from 'path';
import fs from 'fs';
import cx from 'classnames';

import Footer from './Footer';
import Header from './Header';
import {
    get,
    set,
    setInt,
    globalRequire,
    getString,
    getInt
} from '../../common/utils';
import { normalize, confirmation, error } from '../services/utils';
import { toast } from 'react-toastify';
import HTMLEditorOverlay from './HTMLEditorOverlay';
import { modal } from './Modal';
import { shell } from 'electron';
import { getThemeList, getThemeListDetails } from '../services/theme';
import defaultThumbnail from '../images/defaultThemeThumbnail.png';

const ThemeManager: FunctionComponent = () => {
    const { siteId } = useParams();
    const site = get(`sites.${siteId}`) as ISite;
    const { title, theme } = site;

    const [siteTheme, setSiteTheme] = useState(theme);
    const [themeList, setThemeList] = useState([]);

    const getThemes = (noToast?) => {
        const themes = getThemeListDetails();
        console.log('exec', themes);
        setThemeList(themes);

        if (!noToast) {
            toast.success('Theme list refreshed!');
        }
    };

    useEffect(() => {
        getThemes(true);
    }, []);

    const history = useHistory();

    const handleSubmit = async themeName => {
        if (!themeName) {
            modal.alert('Your site must have a theme');
            return;
        }
        setSiteTheme(themeName);

        const updatedSite = {
            ...site,
            theme: themeName
        };
        await set(`sites.${siteId}`, updatedSite);
        await setInt(`sites.${siteId}.publishSuggested`, true);
        toast.success(
            'Site updated! Please publish your changes from your Dashboard'
        );
    };

    const addTheme = async () => {
        const confirmationRes = await confirmation({
            title: `
            <p>The PRSS theme directory will be opened.</p>
            <p>You will need to add any theme files to that directory.</p>
            <p>Please ensure you get themes from trusted sources,
             such as the <a href="https://prss.io/themes" title="https://prss.io/themes" target="_blank" rel="noopener noreferrer"><u>PRSS Themes</u></a> page.</p>
            <p>Continue?</p>
            `
        });

        if (confirmationRes !== 0) {
            return;
        }

        const themesDir = getInt('paths.themes');
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
                    {themeList.map(
                        ({ name, title, author, url, type, themeDir }) => {
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
                                        onClick={() => handleSubmit(name)}
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
                        }
                    )}
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
