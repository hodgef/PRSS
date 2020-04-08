// Import the styles here to process them with webpack
import './index.scss';

import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';
import { initStore } from '../common/Store';
import { checkDirs } from './services/utils';
import { modal } from './components/Modal';

const init = async () => {
    await initStore();
    await checkDirs();
    ReactDOM.render(<App />, document.getElementById('app'));
};

try {
    init();
} catch (e) {
    modal.alert(e.message);
}
