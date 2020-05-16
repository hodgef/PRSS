import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import './styles/Editor.scss';

import { ContentState, convertToRaw, EditorState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import React, { FunctionComponent, useState, useRef } from 'react';
import AceEditor from 'react-ace';
import { Editor } from 'react-draft-wysiwyg';
import pretty from 'pretty';

import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/theme-github';

import { imageUploadCallback } from '../services/editor';

interface IProps {
    value: string;
    onChange?: any;
    onEditModeChange?: any;
    forceMode?: string | null;
}

const StandardEditor: FunctionComponent<IProps> = ({
    value,
    onChange,
    onEditModeChange,
    forceMode
}) => {
    const htmlToEditorState = html => {
        let output = EditorState.createEmpty();

        if (html) {
            const contentBlock = htmlToDraft(html);

            if (contentBlock) {
                const contentState = ContentState.createFromBlockArray(
                    contentBlock.contentBlocks
                );
                output = EditorState.createWithContent(contentState);
            }
        }

        return output;
    };

    const initialEditorState = htmlToEditorState(value);
    const [editorState, setEditorState] = useState(initialEditorState);
    const [editHTMLEnabled, setEditHTMLEnabled] = useState(
        forceMode === 'html'
    );
    const htmlState = useRef(
        forceMode === 'html'
            ? pretty(value, { ocd: true })
            : draftToHtml(convertToRaw(initialEditorState.getCurrentContent()))
    );

    const EditHTMLButton = ({ onClick, title }: any) => {
        if (forceMode) return null;

        return (
            <div
                className="edit-html-button clickable"
                onClick={() => (onClick ? onClick() : toggleEditMode())}
            >
                <i className="material-icons">code</i>
                {title && <span>{title}</span>}
            </div>
        );
    };

    const updateEditorState = state => {
        setEditorState(state);

        const htmlState = draftToHtml(convertToRaw(state.getCurrentContent()));
        onChange && onChange(htmlState);
    };

    const onEditorStateChange: Function = newState => {
        updateEditorState(newState);
    };

    const getDraftHTMLState = () => {
        const html = pretty(
            draftToHtml(convertToRaw(editorState.getCurrentContent())),
            { ocd: true }
        );
        htmlState.current = html;
        return html;
    };

    const toggleEditMode = () => {
        if (forceMode) {
            return;
        } else {
            const isEditHTMLEnabled = !editHTMLEnabled;
            setEditHTMLEnabled(isEditHTMLEnabled);
            onEditModeChange &&
                onEditModeChange(isEditHTMLEnabled ? 'html' : 'text');
        }
    };

    return (
        <div className="standard-editor">
            {editHTMLEnabled || forceMode === 'html' ? (
                <div className="html-editor">
                    {!forceMode && (
                        <div className="html-editor-toolbar rdw-editor-toolbar">
                            <div className="html-editor-toolbar-item">
                                <EditHTMLButton
                                    title="Close HTML Editor"
                                    onClick={() => {
                                        const editorVal = htmlToEditorState(
                                            htmlState.current
                                        );
                                        updateEditorState(editorVal);
                                        toggleEditMode();
                                        htmlState.current = '';
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="html-editor-content">
                        <AceEditor
                            mode="html"
                            theme="github"
                            wrapEnabled
                            width="100%"
                            showPrintMargin={false}
                            showGutter
                            fontSize={17}
                            defaultValue={
                                forceMode === 'html'
                                    ? htmlState.current
                                    : getDraftHTMLState()
                            }
                            value={
                                forceMode === 'html'
                                    ? htmlState.current
                                    : undefined
                            }
                            onChange={html => {
                                htmlState.current = html;

                                if (forceMode === 'html') {
                                    onChange && onChange(htmlState.current);
                                }
                            }}
                            name="html-editor-component"
                            editorProps={{ $blockScrolling: true }}
                        />
                    </div>
                </div>
            ) : (
                <Editor
                    editorState={editorState}
                    onEditorStateChange={onEditorStateChange}
                    toolbarCustomButtons={[<EditHTMLButton key="sup" />]}
                    toolbar={{
                        inline: {
                            bold: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAw0lEQVRIie2Tvw5BMRSHv4hcCx7BIhKDkVUMHkwisVs8CM9BDBY2G4vkTgbkGu5p0gTVv9v9kpMuv/ZrT1uo8KQw1As4ADOgmUKg1x5ohwi+UQfGwFYyi9gCxUAyp1SChmTuplDNxy70ZLz4TLa5g51k5iGCf/UAuikFBXADJr6CX2TAEFhrkk5MgY6SLFMJRpI9phK0MPyHkH+g6Mt4dZnkcoKNZFcxBRll79XiOZ6vyKZyYOqyuI3gCZwp2+K084oP3hKAb9j92feFAAAAAElFTkSuQmCC'
                            },
                            italic: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAjklEQVRIiWNgGAUEACOR6v6Taw4T8W6hD1BmgPjmCwORvifVB2pQ+hYD4WAjywJVJAuIAuRacJtWFsCCiOYWEB1EpAB2BgaGPwyQyBWihQXaUMPfkKKJlCAiOQWRagFZ4U+OD4hOQaRaQHISJRU8Y4BEsgEtDOdhYGD4B8U8pGgkVCKSXQ/AwKCrD0YgAAB/rRaC2WGqFwAAAABJRU5ErkJggg=='
                            },
                            underline: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAnElEQVRIie2VTQ6CMBBGnySy42eL1/EEeAzgmrgirIzRc3AAXXRIGlKrjLCA9Esms5gv8ybTtIU96yXxly9abJwACIAAUAEGyYnHk028swB3yWePZ6zdPJ6PajBvzAPIHfUceIqn0gBioLcgJZBKXKzmHXDUAABOFsQVHVBom4+KgRq4Yg5zAFrMWtSTb0cHT+2X3+xrr9Vv8vb1Br/+IBg/qBrsAAAAAElFTkSuQmCC'
                            },
                            strikethrough: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAOklEQVRIiWNgGAUEACMWsf/UNJOJQsOoDv4zkOhDmvtg1IIRYAG2jAYDpGY4rGaNZrRRC0YtGAVEAAAAewYbx3ARlgAAAABJRU5ErkJggg=='
                            },
                            monospace: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAABaUlEQVRIie3UzUpWURQG4Of7TIXI/BmoJCE4zp8UJLsAs5mjwEYNAsUb8QbqAhwpzkWb1UAEUfLTG2hUzkKJ0Ei/Bmed3BzO0WoU4gubtd/1s9+z1t4cbvE/YhtNLF+RcxQ5fcHfBn8TvD/4l2LhSASaOEVvhcC7yJkOvh/8Y/BnwTfrhcL5sJ/QjlcVAgfJB3XgUfDh4MPBD1OBu3iJ75jFORbRcoXAKKaSnBY8wVjwRiowhy6sooENDGKmRKCRdDAV++OwT5MODtKiHdncJoM/D75eItCKM/zAh8hbCvs+Ymdoywseu7zc4jrHUEUXTVzgJx6EvQh/A/IRzZcckKOOhQoBqMX+s2wktfDv58X3ZPP/hs5IyFeP7NJfyx5BinS+WwX7O16XvZz7WMFJ4ZCvWEM3XvyLAOzKZjahHOMR3yv4e13e08PwDSS+PjcCNVk7+b4KxZw/rrlTcsjf4Nqa4s/uFjcQvwD8P14C3CSaTwAAAABJRU5ErkJggg=='
                            },
                            superscript: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAeklEQVRIie2RMQqAMAwAryL4Aldf4O633UT9hO9wEnRxqktEKRWKBF1yEEIg7SUtGBcVMACr5EpbMAL+Fn3Y4F/GyS51I3kDyBU3KOS+Vuop9WA46RMl0EnvAtTagpnI87lEQUpvbAin+QfRATJFQRQTmMAEHwiM/zkAEi0om7aeogsAAAAASUVORK5CYII='
                            },
                            subscript: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAg0lEQVRIiWNgGAUDDRixiP2nolkMTGQaRhPwn4EM39HcB6MWjFowQiyQY2Bg2MXAwPAZSsuRaxCunLwbSe4/AwPDTmpb8BMqbg6lvyBLspBrGxJgh5qzAcq/QK5BuHwgysDAsB0q94GBgUGHXAtwgVcMqHGA4gislQSJAJuvqGHuIAEA3FIeoeGqcMUAAAAASUVORK5CYII='
                            }
                        },
                        list: {
                            inDropdown: true,
                            unordered: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAASklEQVRIie3TMQqAMBAEwMHXGfz/BxL/oYVWgiiB2LgDW12xd8URv7JgRUMZUdCwnamX2dYRMI3Y9E5xXFExf1kc8V4++VE+OfrslMsq05eCSIkAAAAASUVORK5CYII='
                            },
                            ordered: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAYElEQVRIiWNgGAWDCfyHYqoCRiyWMKLxKTKbiQIDyAJUD6KhD3BFKHrkkw1YkNhsDAwMq9DkqZqKYIaHUWAodluggCZBNPQB3YOoHM2i/xRgBgYGzLJIkNouHk1FIwAAAMPVHDVuPrLYAAAAAElFTkSuQmCC'
                            },
                            indent: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAYUlEQVRIiWNgGAUEACMa/z+1zWWikoHDGFAaB+j6MQAt4qCBBmaiGE6tlIjTcLwW/CcRYzMcxQJqxcF3KpmDF5QzEBFE1LIEDljQFFCaDzoZGBg48SmgekYb+mC0PhgBAAC17x5z77/+3AAAAABJRU5ErkJggg=='
                            },
                            outdent: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAWUlEQVRIiWNgGAUEACMa/z+1zWWikoHDGFAaB+j6MQC14qCDSubgBP9pbcl/Yi35TyLGpg/FElrkg+80MBPu+npaGA6zgCjDyY2DBlwG0jyjDX0wWh+MAAAAM+QpgVKUVRgAAAAASUVORK5CYII='
                            }
                        },
                        textAlign: {
                            inDropdown: true,
                            left: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAM0lEQVRIiWNgGAUEACMa/z+1zWWikoHDGFAjDtDNQAGjcUAQjOaDgQej+WDgwWg+GAEAAKBZBRB/eva4AAAAAElFTkSuQmCC'
                            },
                            center: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAANUlEQVRIiWNgGAUEACMa/z+1zWWikoHDGKDHAQyQGxcY5o3GAUEwmg8GHozmg4EHo/lgBAAAkFEFEKgl/CMAAAAASUVORK5CYII='
                            },
                            right: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAM0lEQVRIiWNgGAUEACMa/z+1zWWikoHDGKDHATZATryMxgHxYDQfDDwYzQcDD0bzwQgAAHhZBRCGXoKDAAAAAElFTkSuQmCC'
                            },
                            justify: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAM0lEQVRIiWNgGAUEACMa/z+1zWWikoHDGFAjDtDNQAGjcUAQjOaDgQej+WDgwWg+GAEAAKBZBRB/eva4AAAAAElFTkSuQmCC'
                            }
                        },
                        colorPicker: {
                            icon:
                                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAABXUlEQVRIieXTPUtcURDG8V90QSSBkCKLsdnCJpCUIYhpBMFOiB8jWPgV/ApiYyViY5o0qcIStNiQwkZwFZtELAyIixB8KYTgprjncnevuu65u434wDTznPmf4ZwZHrue4BP2cIYaPvQLPog1NHPxD9O9gJ92gKdRKwpfQB3rHeBNyXMV6rx+DziN3bRoIOKCS2x2eXYpgotkWhYl3V3ht7u7Xwvno+BLLfCPeImdW+CfUYqBD2I1FF9qH7+y9j9ZD+e7Vkk2LeeYzPmj2G+5oC4ZhK7hX0LhX0zk/Ap+BX87wBdiul8Jxad4l/PGcBj8LbyI6RxmZc+Sh7/GUfB/4HkMOFU1AOZy+bc4Dt4GnhWBw0mAVFpy79EI+W8YLgofD5CGZMvLmJeMaBNfMVQUPoKDAPop+cBr2Rgui1yivL67uZkXkvee6QWc6o3sE/9gSuRmdntJFa/6DX64+g/e8noejrjLUwAAAABJRU5ErkJggg=='
                        },
                        link: {
                            link: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAxElEQVRIie2TzQ3CMAxGH7AEdCVaMQFrkAFQJZYCOkCnob1wCgdCsYxT/lIJoT7JimQnnx07gZFfYwVUQAt4ZRodb4EjUMTEd8ahdxJIK63KPXAGNkDWe0+bDHBBwwO5DFbB6T4Q1rigdZDOJjgXanNfG2LtmwffCWCqgpNvywdmorguQR3WtZHwFZPcNGrpLLgP2ZFmyEu9oSTdM93Gqsi5Tr8xDj1L0AB7q/IRyUM79T9IzuAJUvxc64V1DH6D1PzhkC/LEFwYD64sbwAAAABJRU5ErkJggg=='
                            },
                            unlink: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAA+0lEQVRIie3UwU0DMRAF0AfUQASpYTshERXQBlsAikQr0EOWFJATOdAHmwun5bCGWMa7hGAhDvnSyNYfz5/xjGWO+G+4xgpbdImlSP1bPGE+JH6fCfpJgtgWuco7vOEW09F75jFFHTQ6zGLnKpD1AcIp6qDVxGQbyMvk8Fgbhtp3EbhXOE2cJ78tH2dRcZ8J1mG9ySTcx2J8aKxjcm435FqZIV+lBxbKPdO7oSpm+um3maDvErRY5io/otK3dRJxEzwk3MFo9DPYBMFJ2Hd4LJEgFtwk+yI3gHM8272oF/2X8eWrKIkS3w7+oEVLw0NuRuL2RhWSpM+0QfUO1N10LPbv5hYAAAAASUVORK5CYII='
                            }
                        },
                        embedded: {
                            icon:
                                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAYklEQVRIiWNgGAWDCXgwMDA8ZmBg+E8hfgQ1CwM8ooLhyJZgAJgkpQDFHCYqGIgXsBBwCSmAEZsgzX0wasGoBUPAAnwZDWvGIRXQNYgeQ2lKS1Jks1CABwN1imyc9cEowAoAAR9PDfUg4zoAAAAASUVORK5CYII='
                        },
                        image: {
                            icon:
                                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAyElEQVRIie3UPWoCURTF8d8YCEhaq+AOUqYM9hF76wH34xYss4csQAiktRdnlqBYmiIjjOMbmXFegoUHbnMf5/zfx+Vx1y1pghyHjpVhHAJkEcKPtTmGJiXAocPpQ0qgFzn0TE0Bbxj9JaDn9Dob62bfYIspdm1MdSP3HehNC096wdcI8IkHfJR684pvcS1gjUGx1scXlnis+J6wagvY47WyPsRzyIgXv+/SGDCrCbqkNAT41zHNI4ZnoeZYnB91g/eIm72ro34AVRl6aqj8QT0AAAAASUVORK5CYII=',
                            urlEnabled: true,
                            uploadEnabled: true,
                            alignmentEnabled: true,
                            uploadCallback: imageUploadCallback,
                            previewImage: true,
                            //inputAccept: 'image/*',
                            inputAccept:
                                'image/gif,image/jpeg,image/jpg,image/png,image/svg',
                            alt: { present: false, mandatory: false }
                        },
                        remove: {
                            icon:
                                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAABUUlEQVRIie2UPy8EQRjGf2MVIldIJL6BTkQihFZ3eq2odfcN0DuNQ+5oiH+XSJRaCbVC4gM4rcSdCN0p9lkZa/Z2x43Om2x23neeeX777kwG/sMjFoEnoNvn0wLKLkArgHnyPCamxgJ0++jeFQZgILDpj/ABXBN/lQEe/gLQsMYHHuu+otemPQNDwIjeo8B7zhqvDo6AD2AZWBLwArgCZoESMA1c/raDCWnugRuNx/h+CpPYIONEZpnfan7eqo2rZoAq8ArsApHq6z6AFXfDGKCW0p4Dgxl6p/kLMJxhXpfmDagAbeUnVie5gJrmVpXPKK9a5guqzeVBXIApzd0pLynvKK+kumpaa0/TkCKX2KS0e8rbxJtvgG2Hvu4LOJM20m9IIM0MfccGFL2ukyMYAcc52i0bUPaArBWANAh0W0fAYcp8P5S5Ddkh3o/N0OY94xNh7tL+FN1oTgAAAABJRU5ErkJggg=='
                        },
                        history: {
                            inDropdown: true,
                            undo: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAxElEQVRIie3RP2pCQRCA8V+wtbONQS2FBKy8Q0x6j2MjBE8gmCptQBDMHRKITS4RSBnt/PNsVnyIS94WKRLeB1Ps7ux+M7OUlPwpHn5bkGFwZv8aQ7zhE2t84RUj3KQI8pI6ptjlzmIxR+vcoxcnggNP6KEW1lu8Y4Elquigi0rIWaGPl586yMcOj2hE7lxhHArIsMFtiuA5lnzCXeggw3esoNh8BwUl947/NUsRpEgmjqNtpwiKSpr4CLmXBYsqKfn37AEtKU5Ae4E5ZwAAAABJRU5ErkJggg=='
                            },
                            redo: {
                                icon:
                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAqElEQVRIie3SMQrCMACF4Q+8gsVFB11FL6Gj53Eu6OYieAIXXXQSD+FJBHEQHBV1CVha2jp0sz9kCHn5XxJCTc3fEv8aHGKBEy544Bzmcwxy5O8ycQ/HECwaL+zRSckLCya4h9ANS4wQoYEWxlglclesU+W58mcIbNAsuWmEXc7tMnQTJ5qViJPEvxYcwsK2AnmmoO/75lEF8kxBO2yYViQv/aY1Nf/EB4o3TTM8DEKkAAAAAElFTkSuQmCC'
                            }
                        }
                    }}
                />
            )}
        </div>
    );
};

export default StandardEditor;
