import React, { FunctionComponent } from 'react';
import { useHistory } from "react-router-dom";

const Home: FunctionComponent = () => {
    const history = useHistory();

    return (
        <div>
            Hello <button onClick={() => history.push('/login')}>login</button>
        </div>
    );
};

export default Home;