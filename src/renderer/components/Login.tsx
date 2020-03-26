import React, { FunctionComponent, useContext } from 'react';

import { AppContext } from '../../common/Store';

const Login: FunctionComponent = () => {
    const { score, addPoints } = useContext(AppContext);
    return (
        <div>
            Login {score} <button onClick={addPoints}>Increase</button>
        </div>
    );
};

export default Login;
