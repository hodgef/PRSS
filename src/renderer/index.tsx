// Import the styles here to process them with webpack
import './index.scss';

import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';
import { init } from '../common/Store';
import { checkDirs } from './services/utils';
import ErrorBoundary from './components/ErrorBoundary';

const initApp = async () => {
    await init();
    await checkDirs();

    const PRSS = () => (
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );

    ReactDOM.render(<PRSS />, document.getElementById('app'));
};

initApp();
