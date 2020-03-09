import './styles/PostEditor.scss';

import React, { Fragment, FunctionComponent } from 'react';
import { useHistory, useParams} from 'react-router-dom';

import { get } from '../../common/utils';
import Footer from './Footer';
import Header from './Header';

const PostEditor: FunctionComponent = () => {
    const { siteId, postId } = useParams();
    const { title, url, items } = get(`sites.${siteId}`);
    const post = postId ? items.find(item => item.id === postId) : null;
    const history = useHistory();

    return (
        <div className="PostEditor page">
            <Header undertitle={(
                <Fragment>
                    <i className="material-icons">public</i><span>{title}</span>
                </Fragment>
            )} />
            <div className="content">
                <h1>
                    <div className="left-align">
                        <i className="material-icons clickable" onClick={() => history.goBack()}>arrow_back</i>
                        <span>Post Editor</span>
                    </div>
                    <div className="right-align">
                        <button type="button" className="btn btn-outline-primary">
                            <i className="material-icons">play_arrow</i>
                            <span>Preview</span>
                        </button>

                        <button type="button" className="btn btn-primary">
                            <i className="material-icons">publish</i>
                            <span>Publish</span>
                        </button>
                    </div>
                </h1>
                <div className="editor-container">
                    {post && (
                        <div className="slug-editor">
                            <span className="slug-label">Editing: </span><span className="slug-url">{url}{post.slug}</span>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PostEditor;