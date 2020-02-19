import './styles/CreateBlog.scss';

import React, { FunctionComponent, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { getHostingTypes, setupRemote } from '../services/hosting';
import { normalize, error } from '../services/utils';

const CreateBlog: FunctionComponent = () => {
    const [title, setTitle] = useState("");
    const [hosting, setHosting] = useState("github");
    const [hostingFields, setHostingFields] = useState({});
    const hostingTypes = getHostingTypes();

    const handleSubmit = (): void => {
        if(!(title && hosting)){
            error("Please fill out all fields.");
            return;
        }

        const siteId =  normalize(title);

        const site = {
            id: siteId,
            title,
            hosting: {
                name: hosting,
                ...hostingFields
            },
            type: 'blog'
        } as ISite;

        setupRemote(site);
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


                {hosting && hostingTypes[hosting].fields && hostingTypes[hosting].fields.map(({ name, title, type }) => (
                    <div className="input-group input-group-lg"  key={`${name}-fields`}>
                        <input
                            type={type}
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