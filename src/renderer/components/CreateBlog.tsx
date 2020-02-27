import './styles/CreateBlog.scss';

import React, { FunctionComponent, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { getSampleSiteStructure } from '../services/blog';
import { getHostingTypes, setSite,setupRemote } from '../services/hosting';
import { error, getString, normalize } from '../services/utils';
import Footer from './Footer';
import Header from './Header';
import Loading from './Loading';

const CreateBlog: FunctionComponent = () => {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [loadingStatus, setLoadingStatus] = useState('');
    const [hosting, setHosting] = useState('github');
    const [hostingFields, setHostingFields] = useState({});
    const hostingTypes = getHostingTypes();
    const history = useHistory();

    const handleSubmit = async () => {
        if (!(title && hosting)) {
            error(getString('error_fill_fields'));
            return;
        }

        setLoading(true);
        const siteId = normalize(title);

        const baseSite = {
            ...getSampleSiteStructure(),
            id: siteId,
            title,
            hosting: {
                name: hosting,
                ...hostingFields
            },
            type: 'blog'
        } as ISite;

        /**
         * Set up remote
         */
        const site = await setupRemote(baseSite, setLoadingStatus);
        if (!site) {
            return;
        };

        /**
         * Save site
         */
        setSite(site);

        /**
         * Go to site preview
         */
        history.push(`/sites/${site.id}`);
    };

    return (
        !loading ? (
            <div className="CreateBlog page">
                <Header fixed />
                <div className="content">
                    <h1>{getString('create_blog_title')}</h1>

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
                                        <label className="input-group-text">{getString('hosting_label')}</label>
                                    </div>
                                    <select className="custom-select" onChange={(e) => setHosting(e.target.value)}>
                                        <option value={key}>{title}</option>
                                    </select>
                                </div>
                            );
                        })}


                    {hosting && hostingTypes[hosting].fields && hostingTypes[hosting].fields.map(({ name, title, type }) => (
                        <div className="input-group input-group-lg" key={`${name}-fields`}>
                            <input
                                type={type}
                                placeholder={title}
                                className="form-control"
                                value={hostingFields[name] || ''}
                                onChange={e => setHostingFields({...hostingFields, ...{[name]: e.target.value}})}
                            />
                        </div>
                    ))}

                    <div className="button-container mt-4">
                        <button
                            onClick={handleSubmit}
                            type="button"
                            className="btn btn-primary btn-lg"
                        >{getString('create_blog_button')}</button>
                    </div>
                </div>

                <Footer />
            </div>
        ) : (
            <Loading title={loadingStatus} />
        )
    );
};

export default CreateBlog;