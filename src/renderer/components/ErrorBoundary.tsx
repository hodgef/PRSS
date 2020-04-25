import React, { ReactNode, Fragment } from 'react';
import { modal } from './Modal';

interface IProps {
    children: ReactNode;
}

class ErrorBoundary extends React.Component<IProps> {
    constructor(props) {
        super(props);
    }

    onError = ({ reason }) => {
        console.error(reason);
        modal.alert(
            <Fragment>
                <p>Error:</p>
                <p className="code-dark">${reason.toString()}</p>
            </Fragment>,
            null,
            'error-alert-content'
        );
    };

    componentDidMount() {
        window.onunhandledrejection = error => {
            this.onError(error);
        };
    }

    componentDidCatch(error) {
        this.onError(error);
    }

    render() {
        return this.props.children;
    }
}

export default ErrorBoundary;
