import "./styles/PRSSAI.css";

import React, {
  FunctionComponent,
  Fragment,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { useHistory, useParams } from "react-router-dom";
import { createItems, getSite, updateSite } from "../services/db";
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { IPostItem, ISite, IStructureItem } from "../../common/interfaces";
import { Accordion, Badge, Button, ButtonGroup, Form, InputGroup, Spinner, Toast } from "react-bootstrap";
import prssaiLogo from "../images/prssai.png";
import { storeInt } from "../../common/bootstrap";
import { normalize, removeSpecialChars } from "../services/utils";
import { modal } from "./Modal";
import { toast } from "react-toastify";
import { runCommand, runCommandAsync } from "../../common/utils";
import { getSamplePost} from "../services/site";
import { insertStructureChildren, walkStructure } from "../services/build";
import { v4 as uuidv4 } from "uuid";
import { cloneDeep } from "lodash";
const path = require("path");

const { dialog } = require("@electron/remote");
const fs = require("fs-extra");

interface IProps {
  setHeaderLeftComponent: (comp?: ReactNode) => void;
}

const PRSSAI: FunctionComponent<IProps> = ({
  setHeaderLeftComponent,
}) => {
  const { siteId } = useParams() as any;
  const [inputTopics, setInputTopics] = useState<string[]>([""]);
  const prssaiEnv = useRef<{[key:string]: string}>(null);
  const [status, setStatus] = useState<boolean>();
  const [prompt, setPrompt] = useState<string>("");
  const [promptBusy, setPromptBusy] = useState<boolean>(false);
  const [promptResponse, setPromptResponse] = useState<string>(null);
  const [activeSection, setActiveSection] = useState<string>(storeInt.get("prssaiLastActiveSection"));
  const [progressIndex, setProgressIndex] = useState<number>(null);
  const [progressSave, setProgressSave] = useState<boolean>(false);
  const [progressDocs, setProgressDocs] = useState<{ title: string; body: string; }[]>([]);
  const [prssaiPath, setPrssaiPath] = useState<string>(storeInt.get("prssaiPath") || "");
  const [site, setSite] = useState<ISite>(null);
  const { title } = site || {};

  const history = useHistory();

  useEffect(() => {
    if (!title) {
      return;
    }
    setHeaderLeftComponent(
      <Fragment>
        <div className="align-center">
          <i className="material-symbols-outlined">public</i>
          <a onClick={() => history.push(`/sites/${siteId}`)}>{title}</a>
        </div>
        <div className="align-center">
          <i className="material-symbols-outlined">keyboard_arrow_right</i>
          <a onClick={() => history.push(`/sites/${siteId}/addons`)}>
            prssai
          </a>
        </div>
      </Fragment>
    );
  }, [title]);

  const checkStatus = useCallback(async () => {
    if (prssaiPath) {
      // Path set, verify
      let verify = [
        fs.existsSync(path.join(prssaiPath, "bin"), "utf8"),
        fs.existsSync(path.join(prssaiPath, "app/prssai.py"), "utf8"),
        fs.existsSync(path.join(prssaiPath, "app/.env"), "utf8"),
      ].every(condition => !!condition);

      if (!verify) {
        setStatus(false);
        return;
      }

      // Check container installation status
      const installedContainers = runCommand(path.join(prssaiPath, "bin"), `docker container ls --all`).res;
      const workerInstalled = installedContainers.includes("prssai_worker");
      const chromeInstalled = installedContainers.includes("prssai_chrome");
      const redisInstalled = installedContainers.includes("prssai_redis");

      if (!workerInstalled || !chromeInstalled || !redisInstalled) {
        modal.alert(
          <Fragment>
            <p>We couldn't find the <span className="code-dark-inline">prssai_worker</span>, <span className="code-dark-inline">prssai_chrome</span> and <span className="code-dark-inline">prssai_redis</span> containers in Docker.</p>
            <p>Please ensure you've followed the installation instructions at <a href="https://github.com/prss-io/prssai" target="_blank">github.com/prssai</a>.</p>
          </Fragment>,
          "prssai not installed"
        );
        setStatus(false);
        return;
      }

      // Check Container status
      const runningContainers = runCommand(path.join(prssaiPath, "bin"), `docker ps --filter "name=prss" --filter "status=running"`).res;

      const workerOnline = runningContainers.includes("prssai_worker");
      const chromeOnline = runningContainers.includes("prssai_chrome");
      const redisOnline = runningContainers.includes("prssai_redis");

      if (!workerOnline || !chromeOnline || !redisOnline) {
        setStatus(false);
        return;
      }

      // Load envfile
      const { parsed } = require('dotenv').config({ path: path.join(prssaiPath, "app/.env") }) || {};
      

      // Validate envfile
      if(
        !parsed ||
        ![
          "chrome_host",
          "chrome_port",
          "ollama_host",
          "ollama_model",
          "ollama_port",
          "ollama_scheme",
          "redis_host",
          "redis_port",
          "res_format",
          "res_seo_keywords",
          "res_word_count",
          "system_prompt"
        ].every(key => Object.keys(parsed).includes(key))
      ){
        modal.alert(
          <Fragment>
            <p>Your prssai env file is invalid.</p>
            <p>Please ensure you've followed the installation instructions at <a href="https://github.com/prss-io/prssai" target="_blank">github.com/prssai</a>.</p>
          </Fragment>,
          "prssai env file invalid"
        );
        setStatus(false);
        return;
      }

      prssaiEnv.current = parsed;
      console.log("prssaiEnv", parsed)

      setStatus(verify);
    } else {
      // Path not set, status offline
      setStatus(false);
    }
  }, [status, prssaiPath]);

  const addInputTopicAt = (inputTopicIndex: number) => {
    const newItems = [...inputTopics];
    newItems.splice(inputTopicIndex + 1, 0, "");
    setInputTopics(newItems);
  }

  const removeInputTopicAt = (inputTopicIndex: number) => {
    if (inputTopics.length > 1) {
      const newItems = [...inputTopics];
      newItems.splice(inputTopicIndex, 1);

      const newProgressDocs = [...progressDocs];
      newProgressDocs.splice(inputTopicIndex, 1);

      setInputTopics(newItems);
      setProgressDocs(newProgressDocs);
    } else {
      toast.error("You must keep at least one topic");
    }
  }

  const editInputTopicAt = (e: any, inputTopicIndex: number) => {
    const value = e.target.value;
    const newItems = [...inputTopics];
    newItems[inputTopicIndex] = value;
    setInputTopics(newItems);
    setProgressDocs([]);
  }

  const handleSendTasks = useCallback(() => {
    (async () => {
      if (!inputTopics.every(topic => !!topic.trim().length)) {
        toast.error("You cannot submit empty topics to the AI");
        return;
      }

      const newProgressDocs = []

      let i = 0;
      for (const inputTopic of inputTopics) {
        setProgressIndex(i);
        console.log("task:", removeSpecialChars(inputTopic));
        // Make article request
        const articleText = (await runCommandAsync(`${prssaiPath}/bin`, `${path.join(prssaiPath, "bin/article_silent")} ${removeSpecialChars(inputTopic)}`)).res;

        // Extract title
        const title =
          articleText
            .slice(0, articleText.indexOf("\n"))
            .replace("Headline:", "")
            .replace("Title:", "")
            .replace(/[\*]+?/gm, '')
            .trim();

        // Extract body
        const body =
          articleText
            .slice(articleText.indexOf("\n"))
            .trim();

        newProgressDocs.push({ title, body });
        console.log(articleText);
        i++;
      }

      // Update state
      setProgressDocs([...newProgressDocs]);
      setProgressIndex(null);
      toast.success("Tasks completed");
    })();
  }, [inputTopics, prssaiPath, progressDocs]);

  const handleSavePosts = useCallback(async () => {
    setProgressSave(true);

    const siteRes = await getSite(siteId);

    if (!siteRes) {
      toast.error("Could not fetch site information");
      return;
    }

    let blogUUID;
    let blogNode;
    let blogPage;

    await walkStructure(siteId, siteRes.structure, ((post: IPostItem, node: IStructureItem) => {
      if (post.slug === "blog") {
        blogUUID = post.uuid;
        blogNode = node;
        blogPage = post;
      }
    }));

    if (!blogUUID || !blogNode || !blogPage) {
      toast.error("Blog page not found! Operation aborted as we cannot append blog posts to it.");
      return;
    }

    const updatedBlogNode = cloneDeep(blogNode) as IStructureItem;
    let updatedStructure = cloneDeep(siteRes).structure;
    const newPostItems: IPostItem[] = [];

    progressDocs.forEach(({ title, body }) => {
      const newPostId = uuidv4();
      const randomString = newPostId.substring(0, 5);

      // Update structure
      updatedBlogNode.children.push({
        title: title,
        key: newPostId,
        children: [],
      });

      const parsedBody = body
          .slice(body.indexOf("\n"))
          .replace(/\d\. (.*?)([ ]+)?(-|\:|\n)/gm, '<h3>$1</h3>')
          .replace(/\*\*(.*?)\*\*/gm, '$1')
          .replace(/(?:\r\n|\r|\n)/g, '<br>')
          .trim();

      // Push to newPostItems
      newPostItems.push({
        ...getSamplePost(siteId),
        uuid: newPostId,
        title: title,
        slug: normalize(title) + `-${randomString}`,
        siteId: siteId,
        content: parsedBody,
        template: "post",
        updatedAt: null,
        createdAt: Date.now(),
        vars: {},
      });

      updatedStructure = updatedStructure.map((node) =>
        insertStructureChildren(node, {
          title: title,
          key: newPostId,
          children: [],
        }, blogUUID)
      );
    });

    // Update site structure
    await updateSite(siteId, {
      structure: updatedStructure,
      updatedAt: Date.now(),
    });

    // Create posts
    await createItems(newPostItems);

    setProgressSave(false);
    setProgressDocs([]);
    toast.success("Posts created!");
  }, [inputTopics, prssaiPath, progressDocs]);

  const handlePrompt = useCallback(() => {
    const escapedPrompt = removeSpecialChars(prompt);
    (async () => {
      if (!escapedPrompt?.trim()) {
        toast.error("The prompt must not be empty");
        return;
      }
      setPromptResponse(null);
      setPromptBusy(true);

      console.log("prompt", escapedPrompt);

      // Make prompt request
      const promptRes = (await runCommandAsync(path.join(prssaiPath, "bin"), `${path.join(prssaiPath, "bin/prompt_silent")} ${escapedPrompt}`)).res;

      console.log("promptRes", promptRes);

      setPromptResponse(promptRes);
      setPromptBusy(false);
    })();
  }, [prompt, promptBusy]);

  useEffect(() => {
    checkStatus();
  }, [prssaiPath])

  const handleChangePrssaiDir = async () => {
    const pathObj = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });

    if (pathObj?.filePaths?.length) {
      const configPath = pathObj?.filePaths[0];

      if (configPath !== prssaiPath) {
        await storeInt.set("prssaiPath", configPath);
        setPrssaiPath(configPath);

        toast.success('Path changed. Reloading status');
      }
    }
  };

  useEffect(() => {
    const getData = async () => {
      const siteRes = await getSite(siteId);
      setSite(siteRes);
    };
    getData();
    checkStatus();
  }, []);

  if (!site) {
    return null;
  }

  return (
    <div className="PRSSAI page">
      <div className="content">
        <h1>
          <div className="left-align">
            <i
              className="material-symbols-outlined clickable"
              onClick={() => history.goBack()}
            >
              arrow_back
            </i>
            <span>AI</span>
          </div>
          <div className="right-align">
            <img src={prssaiLogo} width={150} className="mb-3" />
          </div>
        </h1>

        <Row className="mt-3">
          <Col>
            <Accordion defaultActiveKey={typeof activeSection !== "undefined" ? activeSection : status ? "1" : "0"} onSelect={(activeKey: string) => {
              storeInt.set("prssaiLastActiveSection", activeKey);
              setActiveSection(activeKey);
            }}>
              <Accordion.Item eventKey="0">
                <Accordion.Header>Status {status ? (<Badge bg="success ml-2">Online</Badge>) : (<Badge bg="danger ml-2">Offline</Badge>)}</Accordion.Header>
                <Accordion.Body>
                  <div className="mb-4">
                    To use PRSSAI, you must first set up the backend. Check out <a href="https://github.com/prss-io/prssai" target="_blank">github.com/prssai</a> for installation details.
                  </div>
                  <Form>
                    <Form.Group className="form-group">
                      <InputGroup className="input-group-lg">
                        <Form.Label className="col-sm-2 col-form-label">
                          PRSSAI Path
                        </Form.Label>
                        <div className="col-sm-9">
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control"
                              value={prssaiPath}
                              readOnly
                            />
                            <div className="input-group-append">
                              <Button variant="outline-primary" onClick={() => handleChangePrssaiDir()}>
                                <span className="material-symbols-outlined mr-2">folder</span>
                                <span>Change PRSSAI Directory</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </InputGroup>
                    </Form.Group>
                  </Form>
                </Accordion.Body>
              </Accordion.Item>
              {status && (
                <>
                  <Accordion.Item eventKey="1">
                    <Accordion.Header>Batch Create Post</Accordion.Header>
                    <Accordion.Body>
                      <div className="mb-4">Add topics and PRSSAI will take care of the rest.</div>
                      {inputTopics && inputTopics.map((inputTopic, inputTopicIndex) => {
                        return (
                          <InputGroup className="mb-3" key={`topic-${inputTopicIndex}`}>
                            <Button variant="outline-secondary" onClick={() => addInputTopicAt(inputTopicIndex)} disabled={progressIndex !== null || progressSave}>
                              <span title="Add New" className="material-symbols-outlined">add</span>
                            </Button>
                            <Button variant="outline-secondary" onClick={() => removeInputTopicAt(inputTopicIndex)} disabled={progressIndex !== null || progressSave}>
                              <span title="Delete" className="material-symbols-outlined">delete</span>
                            </Button>
                            {progressDocs?.[inputTopicIndex] && (
                              <Button variant="outline-secondary" onClick={() => modal.alert(progressDocs[inputTopicIndex].body, progressDocs[inputTopicIndex].title, "modal-wide")}>
                                <span title="Read Result" className="material-symbols-outlined">description</span>
                              </Button>
                            )}
                            <Form.Control value={inputTopic} onChange={(e) => editInputTopicAt(e, inputTopicIndex)} disabled={progressIndex !== null || progressSave} />
                          </InputGroup>
                        )
                      })}
                      <ButtonGroup>
                        {!progressDocs.length && (
                          <Button variant="primary" onClick={() => handleSendTasks()} disabled={progressIndex !== null || progressSave}>
                            {progressIndex !== null ? (
                              <>
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  aria-hidden="true"
                                  className="mr-2"
                                />
                                <span>Progress: {(progressIndex + 1)}/{inputTopics.length}</span>
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined mr-2">task</span>
                                <span>Send Tasks to AI</span>
                              </>
                            )}
                          </Button>
                        )}
                        {!!progressDocs.length && (
                          <Button variant="success" onClick={() => handleSavePosts()} disabled={progressIndex !== null || progressSave}>
                            {progressSave ? (
                              <>
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  aria-hidden="true"
                                  className="mr-2"
                                />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined mr-2">save</span>
                                <span>Save Blog Posts</span>
                              </>
                            )}
                          </Button>
                        )}
                      </ButtonGroup>
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="2">
                    <Accordion.Header>Prompt</Accordion.Header>
                    <Accordion.Body>
                      <div className="mb-4">Ask anything to the model.</div>
                      <InputGroup className="mb-3">
                        <Form.Control value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handlePrompt();
                          }
                        }} disabled={promptBusy} />
                        <Button variant="outline-secondary" onClick={() => handlePrompt()} disabled={promptBusy}>
                            {promptBusy ? (
                              <Spinner animation="grow" size="sm" />
                            ) : (
                              <span title="Add New" className="material-symbols-outlined">send</span>
                            )}
                        </Button>
                      </InputGroup>
                      {(prompt && (promptResponse || promptBusy)) && (
                        <Toast className="mb-2">
                          <Toast.Header closeButton={false}>
                            <strong className="me-auto">😊 You</strong>
                            <small>just now</small>
                          </Toast.Header>
                          <Toast.Body>
                            <b>{removeSpecialChars(prompt)}</b>
                          </Toast.Body>
                        </Toast>
                      )}
                      {promptResponse && (
                        <Toast className="mb-2">
                          <Toast.Header closeButton={false}>
                            <strong className="me-auto">🤖 {prssaiEnv.current?.ollama_model}</strong>
                            <small>just now</small>
                          </Toast.Header>
                          <Toast.Body>
                            {promptResponse}
                          </Toast.Body>
                        </Toast>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                </>
              )}
            </Accordion>

          </Col>
        </Row>
      </div>
    </div>
  );
};

export default PRSSAI;
