import "./styles/Footer.css";

import React, { FunctionComponent, ReactNode } from "react";

interface IProps {
  leftComponent?: ReactNode;
  rightComponent?: ReactNode;
}

const Footer: FunctionComponent<IProps> = ({ leftComponent, rightComponent }) => {
  return (
    <footer>
      <div className="left-align">{leftComponent}</div>
      <div className="right-align">{rightComponent}</div>
    </footer>
  );
};

export default Footer;
