import './styles/PostEditor.scss';

import React, { Fragment, FunctionComponent } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';

import { get } from '../../common/utils';
import StandardEditor from './Editor';
import Footer from './Footer';
import Header from './Header';

const PostEditor: FunctionComponent = () => {
    const { siteId, postId } = useParams();
    const { title, url, items } = get(`sites.${siteId}`);
    const post = postId ? items.find(item => item.id === postId) : null;
    const history = useHistory();

    return (
        <div className="PostEditor page">
            <Header
                undertitle={
                    <Fragment>
                        <div className="align-center">
                            <i className="material-icons">public</i>
                            <Link to={`/sites/${siteId}`}>{title}</Link>
                        </div>
                        <div className="align-center">
                            <i className="material-icons">
                                keyboard_arrow_right
                            </i>
                            <Link to={`/sites/${siteId}/posts`}>Posts</Link>
                        </div>
                        {post && (
                            <div className="align-center">
                                <i className="material-icons">
                                    keyboard_arrow_right
                                </i>
                                <span>{post.title}</span>
                            </div>
                        )}
                    </Fragment>
                }
            />
            <div className="content">
                <h1>
                    <div className="left-align">
                        <i
                            className="material-icons clickable"
                            onClick={() => history.goBack()}
                        >
                            arrow_back
                        </i>
                        <span>Post Editor</span>
                    </div>
                    <div className="right-align">
                        {/*<button type="button" className="btn btn-outline-primary">
                            <i className="material-icons">play_arrow</i>
                            <span>Preview</span>
                        </button>

                        <button type="button" className="btn btn-primary">
                            <i className="material-icons">publish</i>
                            <span>Publish</span>
                        </button>*/}
                        {post && (
                            <div className="slug-editor mb-2">
                                <span className="slug-label">Editing: </span>
                                <span className="slug-url">
                                    {url}
                                    {post.slug}/
                                </span>
                            </div>
                        )}
                    </div>
                </h1>

                <div className="editor-container">
                    <div className="left-align">
                        <StandardEditor value={post ? post.content : ''} />
                    </div>
                    <div className="right-align">
                        <div className="editor-sidebar">fff</div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PostEditor;
