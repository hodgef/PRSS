import React, {
    FunctionComponent,
    Fragment,
    ReactElement,
    useLayoutEffect,
    ReactNode
} from 'react';
import { clearHooks } from '../../common/bootstrap';

interface IProps {
    RouteComponent: FunctionComponent;
    setAppClass: (v?) => void;
    history: any;
}

const RouteWrapper: FunctionComponent<IProps> = props => {
    const { setAppClass, RouteComponent, history } = props;

    /**
     * Clear hooks on unmount
     */
    useLayoutEffect(() => {
        setAppClass('');
        clearHooks();
    }, [history.location.pathname]);

    const routeComponent = (<RouteComponent {...props} />) as any;
    return routeComponent;
};

export default RouteWrapper;
