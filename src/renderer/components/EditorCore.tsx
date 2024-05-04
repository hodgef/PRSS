import "./styles/EditorCore.css";

import React, {
    useRef,
    useState,
    useCallback,
    useMemo,
} from "react";
import JoditEditor, { Jodit } from "jodit-react";
import { IPostItem, ISite } from "../../common/interfaces";
import { Button, Form, InputGroup } from "react-bootstrap";
import { runHook, storeInt } from "../../common/bootstrap";
import { getPrssaiStatus, sendPrssaiPrompt } from "../services/prssai";
import { modal } from "./Modal";
import { useHistory } from "react-router-dom";

const ContextMenu = ({ site, textContent, currentEvent, innerRef, jodit, currentRange }) => {
    const [value, setValue] = useState("");
    const [isPromptMode, setIsPromptMode] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(true);

    const promptReplaceMode = useRef(false);
    const history = useHistory();

    const handlePrompt = async (promptValue = value) => {
        setShowContextMenu(false);
        if(!promptValue?.trim() || !textContent?.trim()){
            runHook("PostEditor_setStatusMessage", ["error", "The prompt is empty"]);
            return;
        }

        runHook("PostEditor_setIsAIBusy", true);
        console.log(textContent);
        
        let promptText;

        if(promptReplaceMode.current){
            promptText = `Here's something I've written. ---- '${textContent}' ------. ${promptValue}. Important! Respond only with the updated text, nothing more.`;
        } else {
            promptText = `Here's something I've written. ---- '${textContent}' ------. ${promptValue}.`;
        }

        const promptRes = await sendPrssaiPrompt(promptText);

        if(promptRes){
            console.log(promptRes);

            if(promptReplaceMode.current){
                currentRange?.extractContents();
                const div = jodit?.createInside.text(promptRes);
                currentRange?.insertNode(div);
                runHook("PostEditor_setStatusMessage", ["success", "Selection rewritten successfully by PRSSAI"]);
            } else {
                modal.alert(promptRes, "🤖 PRSSAI says:");
            }
        }
        
        runHook("PostEditor_setIsAIBusy", false);
        setShowContextMenu(false);
    }

    const rephraseText = useCallback(() => {
        promptReplaceMode.current = true;
        handlePrompt("Please rephrase this content");
    }, [showContextMenu]);

    const expandText = useCallback(() => {
        promptReplaceMode.current = true;
        handlePrompt("Please add more words to this content");
    }, [showContextMenu]);

    const leftPos = currentEvent?.clientX && window.innerWidth - currentEvent?.clientX < 500 ?
        window.innerWidth - currentEvent?.clientX : currentEvent?.clientX;

    return showContextMenu && <div className="editor-context-menu" style={{ top: currentEvent?.clientY, left: leftPos }} ref={innerRef}>
        <button className="context-menu-prompt" onClick={() => {
            if(isPromptMode) {
                setIsPromptMode(false);
                promptReplaceMode.current = null;
            } else {
                setIsPromptMode(true);
                promptReplaceMode.current = true;
            }
        }} title="Custom Prompt">🤖</button>
        {isPromptMode ? (
            <InputGroup>
                <Form.Control title={promptReplaceMode.current ? "Enter a prompt. Response will replace selection." : "Ask anything..."} placeholder={promptReplaceMode.current ? "Enter a prompt. Response will replace selection" : "Ask anything..."} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handlePrompt();
                    }
                }} />
                <Button variant="primary" onClick={() => handlePrompt()}>
                    <span title="Add New" className="material-symbols-outlined">send</span>
                </Button>
            </InputGroup>
        ) : (
            <>
                <button onClick={rephraseText}>
                    Rephrase text
                </button>
                <button onClick={expandText}>
                    Expand text
                </button>
                <button onClick={() => {
                    setIsPromptMode(true);
                    promptReplaceMode.current = false;
                }}>
                    Ask a question
                </button>
                <button className="context-menu-settings" onClick={() => {
                    history.push(`/sites/${site.uuid}/prssai?activeTab=3`);
                }} title="Custom Prompt">
                    <i className="material-symbols-outlined">settings</i>
                </button>
            </>
        )}
    </div>
};

const Editor = ({ site, item, editorContent, setEditorChanged, onKeyPress }: { site: ISite, item: IPostItem, editorContent: any, setEditorChanged: any, onKeyPress: (e: KeyboardEvent) => void }) => {
    const mouseDownStartedInContainer = useRef(false);
    const currentRange = useRef<Range>(null);
    const currentFragment = useRef<DocumentFragment>(null);
    const currentEvent = useRef<MouseEvent>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const joditRef = useRef<Jodit>(null);

    const [showContextMenu, setShowContextMenu] = useState(false);

    const editor = useRef(null);

    const openContextMenu = useCallback((e, jodit: Jodit) => {
        currentEvent.current = e;
        setShowContextMenu(true);
    }, []);

    const closeContextMenu = useCallback((jodit: Jodit) => {
        setShowContextMenu(false);
    }, []);

    const selectContextMenu = useCallback((jodit: Jodit) => {
        joditRef.current = jodit;

        // Init plugin
        requestIdleCallback(() => {
            const status = getPrssaiStatus();
            console.log("status", status);

            if (!status || storeInt.get("disablePrssaiEditorContextMenu")) {
                return;
            }

            jodit.e.on(
                document.body, 'mousedown',
                (e) => {
                    const container = document.querySelector(".jodit-wysiwyg");
                    if(!container || !contextMenuRef?.current?.contains(e.target)){
                        closeContextMenu(jodit);
                    }
                    mouseDownStartedInContainer.current = container?.contains(e.target);
                }
            );
            jodit.e.on(
                document.body, 'mouseup',
                (e) => {
                    setTimeout(() => {
                        const container = document.querySelector(".jodit-wysiwyg");

                        if(!container){
                            return;
                        }

                        const isContained = container.contains(e.target);

                        if (isContained && mouseDownStartedInContainer.current) {
                            const range = jodit.s.range;
                            const fragment = range.cloneContents();

                            if (fragment.textContent) {
                                currentRange.current = jodit.s.range;
                                currentFragment.current = range.cloneContents();
                                openContextMenu(e, jodit);
                            } else {
                                closeContextMenu(jodit);
                            }
                        }
                    }, 50);
                }, { top: true }
            )

        });
    }, [currentEvent]);

    Jodit.plugins.add("selectContextMenu", selectContextMenu);

    if (!item) {
        return;
    }

    const config = {
        autofocus: true,
        uploader: {
            insertImageAsBase64URI: true,
        },
        buttons:
            "source,|,bold,strikethrough,underline,italic,eraser,|,ul,ol,|,font,fontsize,brush,paragraph,align,|,image,video,table,link,|,fullsize",
        buttonsMD:
            "source,|,bold,strikethrough,underline,italic,eraser,|,ul,ol,|,font,fontsize,paragraph,align,|,image,link,dots",
        buttonsSM:
            "source,|,bold,strikethrough,underline,italic,|,font,paragraph,align,image,link,dots",
        buttonsXS:
            "source,|,bold,underline,italic,|,font,paragraph,align,image,link,dots",
        cleanHTML: {
            removeEmptyElements: false,
            fillEmptyParagraph: false,
            replaceNBSP: false,
        },
        commandToHotkeys: {
            removeFormat: ['ctrl+shift+m', 'cmd+shift+m'],
            insertOrderedList: ['ctrl+shift+7', 'cmd+shift+7'],
            insertUnorderedList: ['ctrl+shift+8, cmd+shift+8'],
            selectall: ['ctrl+a', 'cmd+a'],
            bold: ['ctrl+b']
        },
        events: {
            afterInit(instance) {
                const container = instance.container.querySelector(".jodit-wysiwyg");
                if (container) {
                    container.onkeydown = onKeyPress;
                }
            },
        },
    };

    return (
        <>
            {useMemo(() => (
                <JoditEditor
                    ref={editor}
                    config={config}
                    value={item.content}
                    onChange={content => {
                        editorContent.current = content;
                        setEditorChanged(editorContent.current !== item.content);
                    }}
                />
            ), [])}
            {showContextMenu && currentEvent?.current && (
                <ContextMenu
                    site={site}
                    innerRef={contextMenuRef}
                    textContent={currentFragment.current?.textContent}
                    currentEvent={currentEvent.current}
                    currentRange={currentRange.current}
                    jodit={joditRef.current}
                />
            )}
        </>
    );
}

export default Editor;