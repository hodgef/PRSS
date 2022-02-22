import "./styles/ListSites.css";

import React, {
  FunctionComponent,
  useState,
  Fragment,
  useEffect,
  ReactNode
} from "react";
import { useHistory } from "react-router-dom";

import { toast } from "react-toastify";
import { deleteSites } from "../services/hosting";
import DraggableTree from "./DraggableTree";
import { configGet } from "../../common/utils";
import { getSites } from "../services/db";

interface IProps {
  setHeaderLeftComponent: (comp?: ReactNode) => void;
}

const ListSites: FunctionComponent<IProps> = ({ setHeaderLeftComponent }) => {
  const history = useHistory();

  const [selectEnabled, setSelectEnabled] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const [sites, setSites] = useState(null);

  useEffect(() => {
    setHeaderLeftComponent();
  }, []);

  useEffect(() => {
    const getData = async () => {
      const res = await getSites();
      setSites(res);
    };
    getData();
  }, []);

  if (!sites) {
    return null;
  }

  const toggleSelectEnabled = () => setSelectEnabled(!selectEnabled);

  const deleteSelectedSites = async () => {
    const deleteSuccess = await deleteSites(selectedItems);

    if (deleteSuccess) {
      toast.success("Sites deleted!");
      setSelectedItems([]);
      setSelectEnabled(false);
      const res = await getSites();
      setSites(res);
    } else {
      toast.error("No deletion made");
    }

    /**
     * If there's no sites, redirect to create
     */
    const newSites = configGet("sites");
    if (!Object.keys(newSites).length) {
      history.push("/sites/create");
    }
  };

  const formatSites = rawSitesArr => {
    const sortedObj = rawSitesArr.sort((a, b) => a.name.localeCompare(b.name));

    return sortedObj.map(({ id, name }) => ({
      key: id,
      title: (
        <Fragment>
          <div className="left-align">
            <i className="material-icons mr-2">public</i>
            <div className="site-title">{name}</div>
          </div>
          <div className="right-align"></div>
        </Fragment>
      ),
      children: []
    }));
  };

  const onItemClick = async itemId => {
    const item = await getSites()
      .where("id", itemId)
      .first();
    history.push(`/sites/${item.uuid}`);
  };

  return (
    <div className="ListSites page">
      <div className="content">
        <h1>
          <div className="left-align">
            <span>Your Sites</span>
          </div>
          <div className="right-align">
            {!!Object.keys(sites).length && (
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={toggleSelectEnabled}
              >
                Toggle Select
              </button>
            )}
            {!!selectedItems.length && (
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => deleteSelectedSites()}
              >
                <i className="material-icons">delete</i>
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                history.push({
                  pathname: "/sites/create",
                  state: { showBack: true }
                })
              }
            >
              <i className="material-icons">add</i>
              <span>Create New</span>
            </button>
          </div>
        </h1>
        <div className="items">
          <DraggableTree
            checkable={selectEnabled}
            data={formatSites(sites)}
            onSelect={items => items[0] && onItemClick(items[0])}
            checkedKeys={selectedItems}
            onCheck={setSelectedItems}
            draggable={false}
            checkStrictly
          />
        </div>
      </div>
    </div>
  );
};

export default ListSites;
