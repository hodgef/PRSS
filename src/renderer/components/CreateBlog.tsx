import React, { FunctionComponent, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { remote } from 'electron';
const { dialog } = remote;

import './styles/CreateBlog.scss';
import { setBlog } from '../services/utils';


const CreateBlog: FunctionComponent = () => {
    const [title, setTitle] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [hosting, setHosting] = useState("automatic");

    const handleSubmit = (): void => {
        if(!(title && hosting)){
            dialog.showMessageBox({ title: "Error", message: "Please fill out all fields." });
            return;
        }

        const data = {
            title, hosting
        };

        setBlog(data);
    };

    return (
        <div className="CreateBlog page">
            <Header />
            <div className="content">
                <h1>Create your blog</h1>

                <fieldset>
                    <div className="input-group input-group-lg">
                        <input
                            type="text"
                            placeholder="Title"
                            className="form-control"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="input-group input-group-lg">
                        <input
                            type="text"
                            placeholder="Username (Optional)"
                            className="form-control"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="input-group input-group-lg">
                        <input
                            type="text"
                            placeholder="Email (Optional)"
                            className="form-control"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                </fieldset>
                
                <h2>Hosting</h2>
                
                <div className="form-check">
                    <input
                        className="form-check-input"
                        type="radio"
                        name="hosting"
                        onChange={e => setHosting(e.target.value)}
                        checked
                    />
                    <label className="form-check-label">
                        Automatic
                    </label>
                </div>
                <div className="form-check disabled">
                    <input
                        className="form-check-input"
                        type="radio"
                        name="hosting"
                        onChange={e => setHosting(e.target.value)}
                    />
                    <label className="form-check-label">
                        Manual
                    </label>
                </div>

                <div className="button-container mt-4">
                    <button
                        onClick={handleSubmit}
                        type="button"
                        className="btn btn-primary btn-lg"
                    >Create Blog</button>
                </div>
            </div>


            <Footer />
        </div>
    );
};

export default CreateBlog;