import "./styles/AppSettings.css";

import React, {
  FunctionComponent,
  Fragment,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useHistory } from "react-router-dom";
import path from "path";
import { getConfigPath, isReportIssuesEnabled } from "../../common/utils";
import { confirmation } from "../services/utils";
import { modal } from "./Modal";
import { storeInt } from "../../common/bootstrap";

import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Col from 'react-bootstrap/Col';

const { app, dialog } = require("@electron/remote");
const fs = require("fs-extra");

interface IProps {
  setHeaderLeftComponent: (comp?: ReactNode) => void;
}

const AppSettings: FunctionComponent<IProps> = ({ setHeaderLeftComponent }) => {
  const history = useHistory();
  const [currentConfigPath, setCurrentConfigPath] = useState("");
  const [reportIssues, setReportIssues] = useState(true);

  const getData = async () => {
    setCurrentConfigPath(await getConfigPath());
    setReportIssues(await isReportIssuesEnabled());
  };

  useEffect(() => {
    setHeaderLeftComponent(
      <Fragment>
        <div className="align-center">
          <i className="material-icons">public</i>
          <a onClick={() => history.push("/settings")}>Settings</a>
        </div>
      </Fragment>
    );
    getData();
  }, []);

  const handleChangeConfigDir = async () => {
    const pathObj = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });

    if (pathObj?.filePaths?.length) {
      const configPath = pathObj?.filePaths[0];

      if (configPath !== currentConfigPath) {
        console.log("path", configPath);

        const confirmationRes = await confirmation({
          title: (
            <Fragment>
              <p>The config will be moved to the new location.</p>
              <p>
                If you plan to commit these to Git or Google Drive, please
                ensure they remain private.
              </p>
              <p>PRSS will now restart.</p>
              <p>Continue?</p>
            </Fragment>
          ),
        });

        if (confirmationRes !== 0) {
          modal.alert(["action_cancelled", []]);
          return;
        }

        /**
         * Move files
         */
        fs.copySync(
          path.join(currentConfigPath, "prss.db"),
          path.join(configPath, "prss.db"),
          { overwrite: true }
        );
        fs.copySync(
          path.join(currentConfigPath, "prss.json"),
          path.join(configPath, "prss.json"),
          { overwrite: true }
        );

        await storeInt.set("paths.config", configPath);
        setCurrentConfigPath(configPath);

        modal.alert(["config_path_changed", []]);

        setTimeout(() => {
          app.relaunch();
          app.exit();
        }, 3000);
      }
    }
  };

  return (
    <div className="AppSettings page">
      <div className="content">
        <h1>
          <div className="left-align">
            <i
              className="material-icons clickable"
              onClick={() => history.goBack()}
            >
              arrow_back
            </i>
            <span>Settings</span>
          </div>
          {/*<div className="right-align">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleSubmit()}
                        >
                            <span className="material-icons mr-2">save</span>
                            <span>Save Changes</span>
                        </button>
    </div>*/}
        </h1>

        <Form className="mt-4">
          <div className="form-group row">
            <div className="input-group input-group-lg">
              <label htmlFor="siteConfig" className="col-sm-3 col-form-label">
                Config Location (prss.db, prss.json)
              </label>
              <div className="col-sm-9">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={currentConfigPath}
                    readOnly
                  />
                  <div className="input-group-append">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => handleChangeConfigDir()}
                    >
                      <span className="material-icons mr-2">folder</span>
                      <span>Change Config Directory</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group row">
            <div className="input-group input-group-lg">
              <label htmlFor="report-issues" className="col-sm-3 col-form-label">
                Enable feature reports
              </label>
              <Col className="col-sm-9 d-flex align-items-center">
                <InputGroup>
                  <Form.Check
                    checked={reportIssues}
                    type="switch"
                    id="report-issues"
                    label="This allows PRSS to quickly identify issues and correct them as soon as possible."
                    onChange={async (e) => {
                      setReportIssues(e.target.checked);
                      await storeInt.set("reportIssues", e.target.checked);
                    }}
                  />
                </InputGroup>
              </Col>
            </div>
          </div>

        </Form>
      </div>
    </div>
  );
};

export default AppSettings;
