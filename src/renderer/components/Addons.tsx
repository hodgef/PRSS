import "./styles/Addons.css";

import React, {
  FunctionComponent,
  Fragment,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useHistory, useParams } from "react-router-dom";
import { configGet } from "../../common/utils";
import { getSite } from "../services/db";
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { ISite, ISiteInternal } from "../../common/interfaces";
import prssaiLogo from "../images/prssai.png";
import prssaiBg from "../images/prssai_bg.jpg";
import { prssConfig } from "../../common/bootstrap";
import { disableAddon, enableAddon } from "../services/utils";

interface IProps {
  setHeaderLeftComponent: (comp?: ReactNode) => void;
}

const addonAssets = {
  prssai: {
    logo: prssaiLogo,
    background: prssaiBg
  }
}

const Addons: FunctionComponent<IProps> = ({
  setHeaderLeftComponent,
}) => {
  const { siteId } = useParams() as any;
  const siteInt = configGet(`sites.${siteId}`) as ISiteInternal;
  const [site, setSite] = useState<ISite>(null);
  const [subscribedAddons, setSubcribedAddons] = useState<string[]>(prssConfig.subscribed_addons);
  const { title } = site || {};

  const handleAddAddon = async (id: string) => {
    const updatedSubcribedAddons = [...subscribedAddons, id];
    prssConfig.subscribed_addons = updatedSubcribedAddons;
    setSubcribedAddons(updatedSubcribedAddons);
    await enableAddon(id);
  };

  const handleRemoveAddon = async (id: string) => {
    const updatedSubcribedAddons = subscribedAddons.filter(aId => aId !== id);
    prssConfig.subscribed_addons = updatedSubcribedAddons;
    setSubcribedAddons(updatedSubcribedAddons);
    await disableAddon(id);
  };

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
            Addons
          </a>
        </div>
      </Fragment>
    );
  }, [title]);

  useEffect(() => {
    const getData = async () => {
      const siteRes = await getSite(siteId);
      setSite(siteRes);
    };
    getData();
  }, []);

  if (!site) {
    return null;
  }

  return (
    <div className="Addons page">
      <h1>
        <div className="left-align">
          <i
            className="material-symbols-outlined clickable"
            onClick={() => history.goBack()}
          >
            arrow_back
          </i>
          <span>Addons</span>
        </div>
        <div className="right-align"></div>
      </h1>
      <div className="content">
        <Row className="mt-3">
          <Col>
            {prssConfig.available_addons?.map(addon => {
              return (
                <div key={addon.id} className="page-card" style={{ backgroundImage: `url(${addonAssets[addon.id].background})` }}>
                  <div className="card-content">
                    <div className="card-content-desc">
                      <img src={addonAssets[addon.id].logo} width={150} />
                      <div className="card-text mt-4">
                        <h5>{addon.title}</h5>
                        <p>{addon.description}</p>
                      </div>
                    </div>
                    <div className="card-button-area">
                      {(subscribedAddons.includes(addon.id)) ? (
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleRemoveAddon(addon.id)}
                        >
                          <span className="material-symbols-outlined mr-2">delete</span>
                          <span>Remove from PRSS</span>
                        </button>
                      ): (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleAddAddon(addon.id)}
                        >
                          <span className="material-symbols-outlined mr-2">add</span>
                          <span>Add to PRSS</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Addons;
