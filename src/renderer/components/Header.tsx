import './styles/Header.scss';

import cx from 'classnames';
import React, {
    FunctionComponent,
    ReactNode,
    useState,
    useEffect,
    useRef
} from 'react';
import { useHistory } from 'react-router-dom';

import PRSSLogo from '../images/PRSS.png';
import { configGet } from '../../common/utils';

interface IProps {
    undertitle?: ReactNode;
}

const Header: FunctionComponent<IProps> = ({ undertitle }) => {
    const history = useHistory();

    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const headerMore = useRef(null);
    const hasSites = configGet('sites') || {};

    const handleDOMClick = e => {
        if (headerMore.current && headerMore.current.contains(e.target)) {
            return;
        }

        setShowMoreMenu(false);
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleDOMClick, false);
    }, []);

    useEffect(
        () => () => {
            document.removeEventListener('mousedown', handleDOMClick, false);
        },
        []
    );

    return (
        <header className={cx({ 'has-undertitle': undertitle })}>
            <div className="header-cont">
                <div className="left-align">
                    <div
                        className={cx('logo', {
                            clickable: Object.keys(hasSites).length
                        })}
                        onClick={() =>
                            Object.keys(hasSites).length &&
                            history.push('/sites')
                        }
                    >
                        <img src={PRSSLogo} width="150" />
                    </div>
                </div>
                <div className="right-align">
                    <div className="header-more" ref={headerMore}>
                        <button
                            type="button"
                            className="btn btn-light btn-lg"
                            onClick={() => setShowMoreMenu(true)}
                        >
                            <span className="material-icons">more_horiz</span>
                        </button>
                        {showMoreMenu && (
                            <ul className="drop-menu">
                                <li
                                    className="clickable"
                                    onClick={() => history.push('/settings')}
                                >
                                    <span className="material-icons">
                                        settings
                                    </span>
                                    <span>Settings</span>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>
            </div>
            {undertitle && <div className="header-subtitle">{undertitle}</div>}
        </header>
    );
};

export default Header;
