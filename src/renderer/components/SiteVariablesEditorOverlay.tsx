import './styles/SiteVariablesEditorOverlay.scss';

import React, { FunctionComponent, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

import { noop, camelCase } from '../services/utils';

import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/theme-github';
import { toast } from 'react-toastify';
import { modal } from './Modal';
import { get, set } from '../../common/utils';
import { getPostItem, siteVarToArray } from '../services/hosting';

interface IProps {
    siteId: string;
    postId?: string;
    onClose: noop;
}

const SiteVariablesEditorOverlay: FunctionComponent<IProps> = ({
    siteId,
    postId,
    onClose = noop
}) => {
    const site = get(`sites.${siteId}`);
    const post = postId ? getPostItem(site, postId) : null;
    const postIndex = post
        ? site.items.findIndex(item => item.id === postId)
        : -1;

    const parsedVariables = siteVarToArray(
        (post ? post.vars : site.vars) || {
            '': ''
        }
    );

    const parsedInheritedVariables = post ? siteVarToArray(site.vars) : [];

    const variablesBuffer = useRef(parsedVariables);
    const [variables, setVariables] = useState(parsedVariables);

    const addNew = () => {
        setVariables(prevVars => [...prevVars, { name: '', content: '' }]);
    };

    const setVar = (
        e,
        varIndex: number,
        fieldName: string,
        isNormalized?: boolean
    ) => {
        const newVars = [...variables];

        if (varIndex > -1) {
            newVars[varIndex] = {
                ...newVars[varIndex],
                [fieldName]: isNormalized
                    ? camelCase(e.target.value)
                    : e.target.value
            };

            variablesBuffer;
            setVariables(newVars);
        }
    };

    const delVar = (varIndex: number) => {
        const newVars = [...variables];
        delete newVars[varIndex];

        return setVariables([...newVars.filter(variable => !!variable)]);
    };

    const handleSave = () => {
        /**
         * Removing empty vars
         */
        const varsArray = variables.filter(varItem => !!varItem.name.trim());
        const varObj = {};

        varsArray.forEach(varItem => {
            varObj[varItem.name] = varItem.content;
        });

        /**
         * Save to post
         */
        if (postIndex > -1) {
            set(`sites.${siteId}.items.${postIndex}.vars`, varObj);
            toast.success('Post variables saved!');
        } else {
            /**
             * Save to site
             */
            set(`sites.${siteId}.vars`, varObj);
            toast.success('Site variables saved!');
        }
    };

    const showInfo = () => {
        modal.alert(
            `
            <p>Site Variables are variables that your templates can use.</p>
            <p>For example: <span class="code-dark-inline">headerImageUrl</span></p>
            <p>This variable would be used by some templates as a header image url.</p>
            <p>Each template generally documents the siteVars it uses.</p>
            <p>Note: A variable defined at the post level will override one set at the site level.</p>
            <p>Note 2: Variables are published to your site and therefore public. Do not store sensitive data in variables.</p>
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
                    <div className="left-align">
                        <span>VARIABLES</span>
                    </div>
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
                            className="btn btn-outline-primary mr-2"
                            onClick={() => addNew()}
                        >
                            <span className="material-icons mr-2">add</span>
                            <span>Add New</span>
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
                        <span>Add, edit or delete variables</span>
                    </div>
                    <div
                        className="right-align available-parameters clickable"
                        onClick={() => showInfo()}
                    >
                        <span className="material-icons mr-1">info</span>
                        <span>What are variables?</span>
                    </div>
                </div>

                <div className="variable-list mt-2">
                    <ul>
                        {variables.map((variable, index) => {
                            return (
                                <li
                                    key={`${variable}-${index}`}
                                    className="mb-2"
                                >
                                    <div className="input-group input-group-lg">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Name"
                                            value={variable.name}
                                            maxLength={20}
                                            onChange={e =>
                                                setVar(e, index, 'name')
                                            }
                                            onBlur={e =>
                                                setVar(e, index, 'name', true)
                                            }
                                        />
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Content"
                                            value={variable.content}
                                            onChange={e =>
                                                setVar(e, index, 'content')
                                            }
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary ml-2"
                                            onClick={() => delVar(index)}
                                        >
                                            <span className="material-icons">
                                                delete
                                            </span>
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {post && !!parsedInheritedVariables.length && (
                    <div className="inherited-variable-list mt-5">
                        <h2>INHERITED VARIABLES</h2>
                        <p>
                            To edit inherited variables. Go to your{' '}
                            <Link to={`/sites/${siteId}/settings`}>
                                Site Settings
                            </Link>
                            . You can also override them above.
                        </p>
                        <ul>
                            {parsedInheritedVariables.map((variable, index) => {
                                return (
                                    <li
                                        key={`inehrited-${variable}-${index}`}
                                        className="mb-2"
                                    >
                                        <div className="input-group input-group-lg">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Name"
                                                value={variable.name}
                                                maxLength={20}
                                                readOnly
                                            />
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Content"
                                                value={variable.content}
                                                readOnly
                                            />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SiteVariablesEditorOverlay;
