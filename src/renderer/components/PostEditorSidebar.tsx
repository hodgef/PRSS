import './styles/PostEditorSidebar.scss';

import React, { FunctionComponent, useState, Fragment } from 'react';
import cx from 'classnames';
import { noop, confirmation, error } from '../services/utils';
import Loading from './Loading';
import { getString } from '../../common/utils';
import { modal } from './Modal';
import { getTemplateList } from '../services/theme';

interface IProps {
    site: ISite;
    item: IPostItem;
    previewStarted: boolean;
    editorChanged: boolean;
    previewLoading: boolean;
    buildLoading: boolean;
    deployLoading: boolean;
    publishSuggested: boolean;
    loadingStatus: string;
    forceRawHTMLEditing: boolean;
    onSave?: noop;
    onStopPreview?: noop;
    onStartPreview?: noop;
    onPublish?: noop;
    onRebuild?: noop;
    onChangePostTemplate?: (t: string) => void;
    onOpenRawHTMLOverlay?: noop;
    onOpenVarEditorOverlay?: noop;
    onToggleRawHTMLOnly?: noop;
}

const PostEditorSidebar: FunctionComponent<IProps> = ({
    site,
    item,
    previewStarted,
    editorChanged,
    previewLoading,
    buildLoading,
    deployLoading,
    publishSuggested,
    loadingStatus,
    forceRawHTMLEditing,
    onSave = noop,
    onStopPreview = noop,
    onStartPreview = noop,
    onPublish = noop,
    onChangePostTemplate = t => {},
    onOpenRawHTMLOverlay = noop,
    onOpenVarEditorOverlay = noop,
    onToggleRawHTMLOnly = noop
}) => {
    const themeName = site.theme;
    const currentTemplate = item.template;
    const [showMoreOptions, setShowMoreOptions] = useState(false);

    const templateList = getTemplateList(themeName);

    const toggleForceRawHTML = async () => {
        if (forceRawHTMLEditing) {
            const confirmationRes = await confirmation({
                title: getString('warn_force_raw_html_disable')
            });

            if (confirmationRes !== 0) {
                error(getString('action_cancelled'));
                return;
            }
        }

        onToggleRawHTMLOnly();
    };

    return (
        <div className="editor-sidebar">
            <ul className="editor-sidebar-featured">
                <li
                    title="Save your changes locally"
                    className="clickable"
                    onClick={() => onSave()}
                >
                    {buildLoading ? (
                        <Loading small classNames="mr-1" />
                    ) : (
                        <i className="material-icons">save_alt</i>
                    )}

                    {previewStarted ? (
                        <Fragment>
                            <span>Save &amp; Rebuild</span>{' '}
                        </Fragment>
                    ) : (
                        <Fragment>
                            <span>Save</span>{' '}
                        </Fragment>
                    )}

                    {editorChanged && (
                        <span
                            className="color-red ml-1"
                            title={getString('warn_unsaved_changes')}
                        >
                            *
                        </span>
                    )}
                </li>
                {previewStarted ? (
                    <li
                        title={getString('preview_description_message')}
                        className="clickable"
                        onClick={() => onStopPreview()}
                    >
                        {previewLoading ? (
                            <Loading small classNames="mr-1" />
                        ) : (
                            <i className="material-icons">stop</i>
                        )}
                        <span>Stop Preview</span>
                    </li>
                ) : (
                    <li className="clickable" onClick={() => onStartPreview()}>
                        {previewLoading ? (
                            <Loading small classNames="mr-1" />
                        ) : (
                            <i className="material-icons">play_arrow</i>
                        )}
                        <span>Preview</span>
                    </li>
                )}
                <li
                    title={
                        editorChanged ? getString('warn_unsaved_changes') : ''
                    }
                    className={cx('clickable', {
                        disabled: editorChanged
                    })}
                    onClick={() => {
                        if (!editorChanged) {
                            onPublish();
                        } else {
                            modal.alert(
                                getString('error_publish_save_changes')
                            );
                        }
                    }}
                >
                    {deployLoading ? (
                        <Loading small classNames="mr-1" />
                    ) : (
                        <i className="material-icons">publish</i>
                    )}
                    <span>{deployLoading ? loadingStatus : 'Publish'}</span>
                    {publishSuggested && (
                        <span
                            className="color-red ml-1"
                            title={getString('warn_unpublished_changes')}
                        >
                            *
                        </span>
                    )}
                </li>
            </ul>

            {showMoreOptions && (
                <ul className="editor-sidebar-more">
                    <li>
                        <div className="input-group">
                            <div className="input-group-prepend">
                                <label
                                    className="input-group-text"
                                    htmlFor="theme-selector"
                                >
                                    Template
                                </label>
                            </div>
                            <select
                                className="custom-select"
                                id="theme-selector"
                                onChange={e =>
                                    onChangePostTemplate(e.target.value)
                                }
                                value={currentTemplate}
                            >
                                {templateList.map(templateName => (
                                    <option
                                        key={`option-${templateName}`}
                                        value={templateName}
                                    >
                                        {templateName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </li>
                    <li
                        className="clickable"
                        onClick={() => onOpenRawHTMLOverlay()}
                    >
                        <span className="material-icons">code</span>{' '}
                        <span>Add Raw HTML code</span>
                    </li>
                    <li
                        className="clickable"
                        onClick={() => onOpenVarEditorOverlay()}
                    >
                        <span className="material-icons">create</span>{' '}
                        <span>Edit Variables</span>
                    </li>
                    <li className="clickable">
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={forceRawHTMLEditing}
                                id="force-html-edit"
                                onChange={() => toggleForceRawHTML()}
                            />
                            <label
                                className="form-check-label"
                                htmlFor="force-html-edit"
                            >
                                Force Raw HTML Editing
                            </label>
                        </div>
                    </li>
                </ul>
            )}

            <div
                className="sidebar-more-toggle clickable"
                onClick={() => setShowMoreOptions(!showMoreOptions)}
            >
                {showMoreOptions ? (
                    <Fragment>
                        <span className="material-icons">
                            keyboard_arrow_up
                        </span>{' '}
                        <span>Less Settings</span>
                    </Fragment>
                ) : (
                    <Fragment>
                        <span className="material-icons">
                            keyboard_arrow_down
                        </span>{' '}
                        <span>More Settings</span>
                    </Fragment>
                )}
            </div>
        </div>
    );
};

export default PostEditorSidebar;
