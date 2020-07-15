// Import the styles here to process them with webpack
import './index.scss';

import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';
import { init } from '../common/bootstrap';
import { checkDirs } from './services/utils';
import ErrorBoundary from './components/ErrorBoundary';
import PRSSLogo from './images/icon.png';

const setLoading = () => {
    const appElem = document.querySelector('#app') as HTMLDivElement;
    if (appElem) {
        appElem.style.backgroundImage = `url('${PRSSLogo}')`;
        appElem.classList.add('app-loading');
    }
};

const unsetLoading = () => {
    const appElem = document.querySelector('#app') as HTMLDivElement;
    if (appElem) {
        appElem.style.backgroundImage = '';
        appElem.classList.remove('app-loading');
    }
};

const initApp = async () => {
    setLoading();
    await init();
    await checkDirs();

    const PRSS = () => (
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );

    unsetLoading();
    ReactDOM.render(<PRSS />, document.getElementById('app'));
};

initApp();
