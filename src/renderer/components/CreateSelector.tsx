import './styles/CreateSelector.scss';

import React, { FunctionComponent } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { getString } from '../../common/utils';
import Footer from './Footer';
import Header from './Header';

interface IProps {
    showBack?: boolean;
}

const CreateSelector: FunctionComponent<IProps> = props => {
    const history = useHistory();
    const { state = {} } = useLocation();

    return (
        <div className="CreateSelector page">
            <Header />
            <div className="content">
                <h1 className="mb-4">
                    <div className="left-align">
                        {state.showBack && (
                            <i
                                className="material-icons clickable"
                                onClick={() => history.goBack()}
                            >
                                arrow_back
                            </i>
                        )}
                        <span>What site do you want to create?</span>
                    </div>
                </h1>

                <div className="button-container">
                    <button
                        onClick={() => history.push('/sites/create')}
                        type="button"
                        className="btn btn-primary btn-lg mb-3"
                    >
                        {getString('create_site')}
                    </button>

                    <button
                        onClick={() => {}}
                        type="button"
                        className="btn btn-primary btn-lg disabled"
                    >
                        {getString('create_docs')}
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default CreateSelector;
