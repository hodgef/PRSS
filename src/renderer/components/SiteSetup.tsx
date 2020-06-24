import './styles/SiteSetup.scss';

import React, {
    Fragment,
    FunctionComponent,
    useState,
    useEffect,
    ReactNode
} from 'react';
import { useHistory, useParams } from 'react-router-dom';
import cx from 'classnames';

import { getString, configGet, configSet } from '../../common/utils';
import { buildAndDeploy, getRepositoryUrl } from '../services/hosting';
import { toast } from 'react-toastify';
import Loading from './Loading';
import { getSite, getSites } from '../services/db';
import ghImage from '../images/gh-mark.png';
import prssImage from '../images/prss-sm.png';

interface IProps {
    setHeaderLeftComponent: (comp?: ReactNode) => void;
}

const SiteSetup: FunctionComponent<IProps> = ({ setHeaderLeftComponent }) => {
    const { siteId } = useParams();

    const sites = {}; //configGet('sites');
    const hasSites = !!(Object.keys(sites) && Object.keys(sites).length);
    const [site, setSite] = useState(null);
    const [publishSuggested, setPublishSuggested] = useState(null);
    const [loading, setLoading] = useState(null);
    const [repositoryUrl, setRepositoryUrl] = useState(null);
    const [publishDescription, setPublishDescription] = useState(
        'You have unpublished changes'
    );

    const history = useHistory();
    const { title, url } = (site as ISite) || {};

    useEffect(() => {
        if (!siteId && !hasSites) {
            setHeaderLeftComponent(/*
                <Fragment>
                    <div className="align-center">
                        <a onClick={() => {}}>Welcome</a>
                    </div>
                </Fragment>
            */);
        } else {
            if (!site) {
                return;
            }

            setHeaderLeftComponent(
                <Fragment>
                    <div className="align-center">
                        <i className="material-icons">public</i>
                        <a onClick={() => history.push(`/sites/${siteId}`)}>
                            {site ? site.title : ''}
                        </a>
                    </div>
                    <div className="align-center">
                        <i className="material-icons">keyboard_arrow_right</i>
                        <a
                            onClick={() =>
                                history.push(`/sites/${siteId}/hosting`)
                            }
                        >
                            Change hosting
                        </a>
                    </div>
                </Fragment>
            );
        }
    }, [site]);

    useEffect(() => {
        const getData = async () => {
            if (siteId) {
                const res = await getSite(siteId);
                setSite(res);
            }
        };
        getData();
    }, []);

    const features = [
        {
            id: 'github',
            title: (
                <div>
                    GitHub (Default)
                    {/*<span className="material-icons" title="Recommended">
                        check_circle
            </span>*/}
                </div>
            ),
            description: 'Host with Github Pages',
            image: ghImage,
            className: '',
            tooltip: '',
            onClick: () => {
                /*history.push({
                    pathname: `/sites/${siteId}/posts`,
                    state: { showBack: true }
                });*/
            }
        },
        /*{
            id: 'prss',
            title: 'PRSS Hosting',
            description: 'Coming soon',
            image: prssImage,
            disabled: true,
            className: '',
            tooltip: '',
            onClick: () => {}
        },*/
        {
            id: 'none',
            title: 'None',
            description: 'Self-host & Manual Deployment',
            icon: 'highlight_off',
            className: '',
            tooltip: '',
            onClick: () => {
                /*history.push({
                    pathname: `/sites/${siteId}/settings`,
                    state: { showBack: true }
                });*/
            }
        }
    ];

    return (
        <div className="SiteSetup page">
            <div className="content">
                <h1>
                    <div className="left-align">
                        <i
                            className="material-icons clickable"
                            onClick={() => history.push('/sites')}
                        >
                            arrow_back
                        </i>
                        {site ? (
                            <span>Change Hosting</span>
                        ) : (
                            <span>
                                {hasSites ? 'Create your site' : 'Welcome'}
                            </span>
                        )}
                    </div>
                </h1>
                {!hasSites && (
                    <div className="sites-intro mb-5">
                        <div className="image-label">
                            <h2>Choose a host for your site</h2>
                        </div>
                    </div>
                )}
                <div className="items">
                    <ul>
                        {features.map((item, index) => {
                            const {
                                id,
                                title,
                                description,
                                icon,
                                image,
                                //disabled,
                                onClick = () => {},
                                className = '',
                                tooltip
                            } = item;
                            return (
                                <li
                                    key={`${title}-${index}`}
                                    className={cx(className, 'clickable', {
                                        //disabled
                                    })}
                                    onClick={onClick}
                                    title={tooltip}
                                >
                                    {loading === id ? (
                                        <Loading medium classNames="mr-1" />
                                    ) : (
                                        <div className="image-cnt">
                                            {image ? (
                                                <img src={image} />
                                            ) : (
                                                <i className="material-icons">
                                                    {icon}
                                                </i>
                                            )}
                                        </div>
                                    )}
                                    <div className="desc-container">
                                        <div className="feature-title">
                                            {title}
                                        </div>
                                        <div className="feature-description">
                                            {description}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SiteSetup;
