// Import the styles here to process them with webpack
import './index.scss';

import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';
import { initStore } from '../common/Store';
import { checkDirs } from './services/utils';
import ErrorBoundary from './components/ErrorBoundary';

const init = async () => {
    await initStore();
    await checkDirs();

    const PRSS = () => (
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );

    ReactDOM.render(<PRSS />, document.getElementById('app'));
};

init();
