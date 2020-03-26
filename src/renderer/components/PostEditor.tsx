import './styles/PostEditor.scss';

import React, {
    Fragment,
    FunctionComponent,
    useRef,
    useState,
    useEffect
} from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';

import { get, getString, set } from '../../common/utils';
import StandardEditor from './Editor';
import Footer from './Footer';
import Header from './Header';
import { modal } from './Modal';
import { toast } from 'react-toastify';
import {
    previewServer,
    stopPreview,
    bufferAndStartPreview
} from '../services/preview';
import Loading from './Loading';
import { build } from '../services/build';
import { store } from '../../common/Store';
import { deploy } from '../services/hosting';

const PostEditor: FunctionComponent = () => {
    const { siteId, postId } = useParams();
    const [site, setSite] = useState(get(`sites.${siteId}`));
    const { title, url, items } = site;
    const post = postId ? items.find(item => item.id === postId) : null;
    const history = useHistory();
    const editorContent = useRef(post ? post.content : '');
    const editorMode = useRef('');
    const [previewStarted, setPreviewStarted] = useState(previewServer.active);

    const [previewLoading, setPreviewLoading] = useState(false);
    const [buildLoading, setBuildLoading] = useState(false);
    const [deployLoading, setDeployLoading] = useState(false);

    // const autosaveInterval = useRef(null);
    // const autosaveMs = 600000; // 10 mins

    /**
     * Check for item changes
     */
    const unsubscribe = store.onDidChange(
        `sites.${siteId}` as any,
        newValue => {
            console.log('NEW SITE', newValue);
            setSite({ ...newValue });
        }
    );

    useEffect(
        () => () => {
            unsubscribe();
        },
        []
    );

    const handleSave = async (isAutosave = false) => {
        setBuildLoading(true);

        if (editorMode.current === 'html') {
            modal.alert(getString('error_save_text_editor'));
            setBuildLoading(false);
            return;
        }

        if (editorContent.current === post.content) {
            setBuildLoading(false);
            toast.success('No changes to save');
            return;
        }

        const content = editorContent.current;
        const itemIndex = items.findIndex(item => item.id === postId);
        const msTime = Date.now();

        if (itemIndex > -1) {
            const updatedItem = { ...post, content, updatedAt: msTime };

            /**
             *  Update items
             */
            set(`sites.${siteId}.items.${itemIndex}`, updatedItem);

            /**
             * Update site updatedAt
             */
            set(`sites.${siteId}.updatedAt`, msTime);

            if (isAutosave) {
                toast.success('Post autosaved');
            } else {
                if (previewServer.active) {
                    await buildPost(postId);
                    previewServer.reload();
                }

                toast.success('Post saved!');
            }
        }

        setBuildLoading(false);
    };

    const buildPost = async postId => {
        if (previewServer.active) {
            previewServer.pause();
        }
        await build(siteId, null, postId);
        if (previewServer.active) {
            previewServer.resume();
        }
    };

    const handleStartPreview = async () => {
        setPreviewLoading(true);

        if (editorMode.current === 'html') {
            modal.alert(getString('error_preview_text_editor'));
            setPreviewLoading(false);
            return;
        }

        const previewRes = await bufferAndStartPreview(site, postId);

        if (previewRes) {
            setPreviewStarted(true);
        }

        setPreviewLoading(false);
    };

    const handleStopPreview = () => {
        setPreviewLoading(true);

        if (editorMode.current === 'html') {
            modal.alert(getString('error_preview_text_editor'));
            setPreviewLoading(false);
            return;
        }

        stopPreview();
        setPreviewStarted(false);
        setPreviewLoading(false);
    };

    const handlePublish = async () => {
        setDeployLoading(true);
        const curSite = get(`sites.${siteId}`);

        await deploy(curSite, [
            p => {
                console.log('handlePublish Progress:', p);
            },
            postId
        ]);

        setDeployLoading(false);
    };

    useEffect(
        () => () => {
            stopPreview();
        },
        []
    );

    return (
        <div className="PostEditor page fixed">
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
                                    {post.slug + '/'}
                                </span>
                            </div>
                        )}
                    </div>
                </h1>

                <div className="editor-container">
                    <div className="left-align">
                        <StandardEditor
                            value={post ? post.content : ''}
                            onChange={content =>
                                (editorContent.current = content)
                            }
                            onEditModeChange={mode =>
                                (editorMode.current = mode)
                            }
                        />
                    </div>
                    <div className="right-align">
                        <div className="editor-sidebar">
                            <ul>
                                <li
                                    className="clickable"
                                    onClick={() => handleSave()}
                                >
                                    {buildLoading ? (
                                        <Loading small classNames="mr-1" />
                                    ) : (
                                        <i className="material-icons">
                                            save_alt
                                        </i>
                                    )}
                                    <span>Save</span>
                                </li>
                                {previewStarted ? (
                                    <li
                                        className="clickable"
                                        onClick={() => handleStopPreview()}
                                    >
                                        {previewLoading ? (
                                            <Loading small classNames="mr-1" />
                                        ) : (
                                            <i className="material-icons">
                                                stop
                                            </i>
                                        )}
                                        <span>Stop Preview</span>
                                    </li>
                                ) : (
                                    <li
                                        className="clickable"
                                        onClick={() => handleStartPreview()}
                                    >
                                        {previewLoading ? (
                                            <Loading small classNames="mr-1" />
                                        ) : (
                                            <i className="material-icons">
                                                play_arrow
                                            </i>
                                        )}
                                        <span>Preview</span>
                                    </li>
                                )}
                                <li
                                    className="clickable"
                                    onClick={() => handlePublish()}
                                >
                                    {deployLoading ? (
                                        <Loading small classNames="mr-1" />
                                    ) : (
                                        <i className="material-icons">
                                            publish
                                        </i>
                                    )}
                                    <span>Publish</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PostEditor;
