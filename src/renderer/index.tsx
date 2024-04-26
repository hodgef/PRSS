// Import the styles here to process them with webpack
import "./index.css";

import React from "react";
import { createRoot } from 'react-dom/client';
import Loader from "./components/Loader";
import ErrorBoundary from "./components/ErrorBoundary";

import PRSSLogo from "./images/icon.png";
import background from "./images/background.jpg";

const initApp = async () => {
  const setLoading = () => {
      const appElem = document.querySelector("#app") as HTMLDivElement;
      if (appElem) {
        appElem.style.backgroundImage = `url('${PRSSLogo}'), linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.9)), url('${background}')`;
        appElem.classList.add("app-loading");
      }
  };

  setLoading();

  const PRSS = () => (
    <ErrorBoundary>
      <Loader />
    </ErrorBoundary>
  );
  const root = createRoot(document.getElementById("app"));
  root.render(<PRSS />);
};

initApp();
