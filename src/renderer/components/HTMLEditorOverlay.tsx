import './styles/HTMLEditorOverlay.scss';

import React, { FunctionComponent, useRef } from 'react';

import { noop } from '../services/utils';

import AceEditor from 'react-ace';
import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/theme-github';
import pretty from 'pretty';
import { globalRequire } from '../../common/utils';
import { toast } from 'react-toastify';
import { modal } from './Modal';
import bufferItemMockJson from '../mockData/bufferItem.json';
const htmlMinifier = globalRequire('html-minifier');

interface IProps {
    headDefaultValue?: string;
    footerDefaultValue: string;
    onSave: (headHtml: string, footerHtml: string) => void;
    onClose: noop;
}

const HTMLEditorOverlay: FunctionComponent<IProps> = ({
    headDefaultValue = '',
    footerDefaultValue = '',
    onSave = (h, f) => {},
    onClose = noop
}) => {
    const headHTMLState = useRef(headDefaultValue);
    const footerHTMLState = useRef(footerDefaultValue);

    const handleSave = () => {
        if (
            onSave &&
            (headHTMLState.current !== headDefaultValue ||
                footerHTMLState.current !== footerDefaultValue)
        ) {
            onSave(
                htmlMinifier.minify(headHTMLState.current),
                htmlMinifier.minify(footerHTMLState.current)
            );
        } else {
            toast.success('No changes detected');
        }
    };

    const showParametersInfo = () => {
        modal.alert(
            `
            <p>You can add parameters to your HTML</p>
            <p>For example: <span class="code-dark-inline">&lt;title&gt;%item.title%&lt;/title&gt;</span></p>
            <p>Here are the available parameters (with sample data):</p>
            <div class="code-dark">
${JSON.stringify(bufferItemMockJson, null, 2)}
            </div>
        `,
            null,
            'parameters-info-content',
            'parameters-info-inner-content'
        );
    };

    return (
        <div className="html-editor-overlay">
            <div className="editor-content">
                <h2>
                    <div className="left-align">HEAD HTML</div>
                    <div className="right-align">
                        <button
                            type="button"
                            className="btn btn-primary mr-2"
                            onClick={() => handleSave()}
                        >
                            <span className="material-icons mr-2">save</span>
                            <span>Save</span>
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => onClose()}
                        >
                            <span className="material-icons">clear</span>
                        </button>
                    </div>
                </h2>

                <div className="title-label">
                    <div className="left-align">
                        Add Raw HTML to the &lt;HEAD&gt;
                    </div>
                    <div
                        className="right-align available-parameters clickable"
                        onClick={() => showParametersInfo()}
                    >
                        <span className="material-icons mr-1">assistant</span>
                        <span>See available parameters</span>
                    </div>
                </div>

                <AceEditor
                    mode="html"
                    theme="github"
                    wrapEnabled
                    width="100%"
                    showPrintMargin={false}
                    showGutter
                    fontSize={17}
                    value={pretty(headHTMLState.current)}
                    onChange={html => {
                        headHTMLState.current = html;
                    }}
                    name="html-editor-component"
                    editorProps={{ $blockScrolling: true }}
                />

                <h2>FOOTER HTML</h2>
                <div className="title-label">
                    <div className="left-align">
                        Add Raw HTML to the end of the &lt;BODY&gt;
                    </div>
                    <div
                        className="right-align available-parameters clickable"
                        onClick={() => showParametersInfo()}
                    >
                        <span className="material-icons mr-1">assistant</span>
                        <span>See available parameters</span>
                    </div>
                </div>

                <AceEditor
                    mode="html"
                    theme="github"
                    wrapEnabled
                    width="100%"
                    showPrintMargin={false}
                    showGutter
                    fontSize={17}
                    value={pretty(footerHTMLState.current)}
                    onChange={html => {
                        footerHTMLState.current = html;
                    }}
                    name="html-editor-component"
                    editorProps={{ $blockScrolling: true }}
                />
            </div>
        </div>
    );
};

export default HTMLEditorOverlay;
