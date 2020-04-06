// Import the styles here to process them with webpack
import './index.scss';

import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';
import { initStore } from '../common/Store';
import { checkDirs } from './services/utils';

const init = async () => {
    await initStore();
    await checkDirs();
    ReactDOM.render(<App />, document.getElementById('app'));
};

init();
