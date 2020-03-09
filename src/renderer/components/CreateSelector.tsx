import './styles/CreateSelector.scss';

import React, { FunctionComponent } from 'react';
import { useHistory } from 'react-router-dom';

import { getString } from '../../common/utils';
import Footer from './Footer';
import Header from './Header';

const CreateSelector: FunctionComponent = () => {
    const history = useHistory();

    return (
        <div className="CreateSelector page">
            <Header />
            <div className="content">
                <button
                    onClick={() => history.push('/create/blog')}
                    type="button"
                    className="btn btn-primary btn-lg mb-3"
                >{getString('create_blog')}</button>

                <button
                    onClick={() => {}}
                    type="button"
                    className="btn btn-primary btn-lg disabled"
                >{getString('create_docs')}</button>
            </div>
            <Footer />
        </div>
    );
};

export default CreateSelector;