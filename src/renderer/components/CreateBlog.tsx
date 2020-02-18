import './styles/CreateBlog.scss';

import React, { FunctionComponent, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { remote } from 'electron';
import { getHostingTypes } from '../services/hosting';
import { setSite } from '../services/utils';

const { dialog } = remote;


const CreateBlog: FunctionComponent = () => {
    const [title, setTitle] = useState("");
    const [hosting, setHosting] = useState("github");
    const [hostingFields, setHostingFields] = useState({});
    const hostingTypes = getHostingTypes();

    const handleSubmit = (): void => {
        if(!(title && hosting)){
            dialog.showMessageBox({ title: "Error", message: "Please fill out all fields." });
            return;
        }

        setSite({
            title,
            hosting: {
                name: hosting,
                ...hostingFields
            },
        });
    };

    return (
        <div className="CreateBlog page">
            <Header fixed />
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
                </fieldset>
 

                    {Object.keys(hostingTypes).map((key) => {
                        const { title } = hostingTypes[key];

                        return (
                            <div className="input-group input-group-lg" key={`hosting-${key}`}>
                                <div className="input-group-prepend">
                                    <label className="input-group-text">Hosting</label>
                                </div>
                                <select className="custom-select" onChange={(e) => setHosting(e.target.value)}>
                                    <option value={key}>{title}</option>
                                </select>
                            </div>
                        );
                    })}


                {hosting && hostingTypes[hosting].fields && hostingTypes[hosting].fields.map(({ name, title }) => (
                    <div className="input-group input-group-lg"  key={`${name}-fields`}>
                        <input
                            type="text"
                            placeholder={title}
                            className="form-control"
                            value={hostingFields[name] || ""}
                            onChange={e => setHostingFields({...hostingFields, ...{[name]: e.target.value}})}
                        />
                    </div>
                ))}

                <div className="button-container mt-4">
                    <button
                        onClick={handleSubmit}
                        type="button"
                        className="btn btn-primary btn-lg"
                    >Create</button>
                </div>
            </div>


            <Footer />
        </div>
    );
};

export default CreateBlog;