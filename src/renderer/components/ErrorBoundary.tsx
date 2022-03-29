import React, { ReactNode, Fragment } from "react";
import { modal } from "./Modal";

interface IProps {
  children: ReactNode;
}

class ErrorBoundary extends React.Component<IProps> {
  constructor(props) {
    super(props);
  }

  onError = (error) => {
    console.error(error);
    modal &&
      error &&
      error.reason &&
      modal.alert(
        <Fragment>
          <p>Error:</p>
          <p className="code-dark">${error.reason.toString()}</p>
        </Fragment>,
        null,
        "error-alert-content"
      );
  };

  componentDidMount() {
    window.onunhandledrejection = (error) => {
      error && this.onError(error);
    };
  }

  static getDerivedStateFromError(error) {
    console.error("PRSS FATAL", error);
    return;
  }

  componentDidCatch(error) {
    error && this.onError(error);
  }

  render() {
    return this.props.children;
  }
}

export default ErrorBoundary;
