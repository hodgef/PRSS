// Import the styles here to process them with webpack
import './index.scss';

import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';
import { initStore } from '../common/Store';

const init = async () => {
    await initStore();
    ReactDOM.render(<App />, document.getElementById('app'));
};

init();
