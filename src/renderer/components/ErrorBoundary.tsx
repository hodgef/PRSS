import React, { ReactNode } from 'react';
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
            `
          <p>Error:</p>
          <p class="code-dark">${reason.toString()}</p>
        `,
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
