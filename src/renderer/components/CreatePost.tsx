import "./styles/CreatePost.css";

import React, {
  FunctionComponent,
  Fragment,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useHistory, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import { normalize, error, removeStopWords } from "../services/utils";
import { walkStructure, insertStructureChildren } from "../services/build";
import { toast } from "react-toastify";
import { isValidSlug, getRootPost } from "../services/hosting";
import { getSite, getItems, updateSite, createItems } from "../services/db";

interface IProps {
  setHeaderLeftComponent: (comp?: ReactNode) => void;
}

const CreatePost: FunctionComponent<IProps> = ({ setHeaderLeftComponent }) => {
  const { siteId } = useParams() as any;

  const [site, setSite] = useState(null);
  const [items, setItems] = useState(null);
  const { title, structure } = (site as ISite) || {};

  const [formattedStructure, setFormattedStructure] = useState(structure);
  const [postTitle, setPostTitle] = useState("");
  const [postSlug, setPostSlug] = useState("");
  const [postParent, setPostParent] = useState("");
  const history = useHistory();

  useEffect(() => {
    if (!title) {
      return;
    }
    setHeaderLeftComponent(
      <Fragment>
        <div className="align-center">
          <i className="material-icons">public</i>
          <a onClick={() => history.push(`/sites/${siteId}`)}>{title}</a>
        </div>
        <div className="align-center">
          <i className="material-icons">keyboard_arrow_right</i>
          <a onClick={() => history.push(`/sites/${siteId}/posts`)}>Posts</a>
        </div>
        <div className="align-center">
          <i className="material-icons">keyboard_arrow_right</i>
          <a onClick={() => history.push(`/sites/${siteId}/posts/create`)}>
            Create Post
          </a>
        </div>
      </Fragment>
    );
  }, [title]);

  useEffect(() => {
    const getData = async () => {
      const siteRes = await getSite(siteId);
      const itemsRes = await getItems(siteId);
      setFormattedStructure(
        await walkStructure(siteId, siteRes.structure, ({ title }) => ({
          title,
        }))
      );

      setSite(siteRes);
      setItems(itemsRes);
    };
    getData();
  }, []);

  if (!site || !items) {
    return null;
  }

  const formatStructureOptions = (node, options = [], parents = []) => {
    const indent = parents.map(() => "--").join("") + " ";

    options.push(
      <option value={node.key} key={node.key}>
        {indent}
        {node.title}
      </option>
    );

    if (node.children) {
      node.children.forEach((childrenNode) => {
        formatStructureOptions(childrenNode, options, [...parents, node.key]);
      });
    }

    return options;
  };

  const formattedStructureOptions = formatStructureOptions(
    formattedStructure[0]
  );

  const handleSubmit = async () => {
    const postTitleTrimmed = postTitle.trim();

    if (!postTitleTrimmed) {
      error("You must provide a title");
      return;
    }

    const postId = uuidv4();
    const rootPost = getRootPost(site);

    const cleanedTitle = removeStopWords(postTitleTrimmed)
      ? removeStopWords(postTitleTrimmed)
      : postTitleTrimmed;
    let normalizedSlug = normalize(postSlug || cleanedTitle);

    if (!normalizedSlug) {
      error(
        "URL Slug error. Please provide a URL Slug for your post or choose a different title."
      );
      return;
    }

    if (
      !(await isValidSlug(normalizedSlug, siteId, null, postParent || rootPost))
    ) {
      const randomString = postId.substring(0, 5);
      normalizedSlug += `-${randomString}`;
    }

    const newItem = {
      uuid: postId,
      title: postTitle.trim(),
      slug: normalizedSlug,
      siteId: siteId,
      content: "",
      template: "post",
      updatedAt: null,
      createdAt: Date.now(),
      vars: {},
    };

    const structureItem = {
      key: postId,
      children: [],
    };

    /**
     * Insert post in structure
     */
    let newStructure = structure;

    if (!postParent) {
      newStructure[0].children.push(structureItem);
    } else {
      newStructure = newStructure.map((node) =>
        insertStructureChildren(node, structureItem, postParent)
      );
    }

    /**
     * Saving
     */
    await updateSite(siteId, {
      structure: newStructure,
    });

    await createItems([newItem]);

    history.push(`/sites/${siteId}/posts/editor/${postId}`);
    toast.success("Post Created! You can now edit its content");
  };

  return (
    <div className="CreatePost page">
      <div className="content">
        <h1>
          <div className="left-align">
            <i
              className="material-icons clickable"
              onClick={() => history.goBack()}
            >
              arrow_back
            </i>
            <span>Create Post</span>
          </div>
          <div className="right-align">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSubmit()}
            >
              <span className="material-icons mr-2">save</span>
              <span>Create</span>
            </button>
          </div>
        </h1>

        <form className="mt-4">
          <div className="form-group">
            <div className="input-group input-group-lg">
              <input
                className="form-control form-control mb-2"
                type="text"
                placeholder="Post Title"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
              ></input>
            </div>
          </div>
          <div className="form-group">
            <div className="input-group input-group-lg">
              <input
                className="form-control form-control mb-2"
                type="text"
                placeholder="URL Slug (Optional)"
                value={postSlug}
                onChange={(e) => setPostSlug(e.target.value)}
                onBlur={(e) => setPostSlug(normalize(e.target.value))}
              ></input>
            </div>
          </div>
          <div className="form-group">
            <div className="input-group input-group-lg">
              <select
                className="form-control form-control custom-select mb-3"
                value={postParent}
                onChange={(e) => setPostParent(e.target.value)}
              >
                <option value="">Parent (Optional)</option>
                {formattedStructureOptions}
              </select>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
