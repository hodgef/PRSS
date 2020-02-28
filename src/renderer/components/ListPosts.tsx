import './styles/ListPosts.scss';

import React, { Fragment, FunctionComponent, useState } from 'react';
import { useHistory, useParams} from 'react-router-dom';

import { confirmation, get } from '../services/utils';
import Footer from './Footer';
import Header from './Header';

const ListPosts: FunctionComponent = () => {
    const { siteId } = useParams();
    const { items, title } = get(`sites.${siteId}`);
    const history = useHistory();
    const [selectEnabled, setSelectEnabled] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);

    const toggleSelectEnabled = () => setSelectEnabled(!selectEnabled);

    const toggleSelectCheck = (id: string) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(
                selectedItems.filter(curId => curId !== id)
            );
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    }

    const deleteSelectedPosts = () => {
        confirmation({ title: 'Are you sure?' });
    }

    return (
        <div className="ListPosts page">
            <Header undertitle={(
                <Fragment>
                    <i className="material-icons">public</i><span>{title}</span>
                </Fragment>
            )} />
            <div className="content">
                <h1>
                    <div className="left-align">
                        <i className="material-icons clickable" onClick={() => history.goBack()}>arrow_back</i>
                        <span>Posts</span>
                    </div>
                    <div className="right-align">
                        <button type="button" className="btn btn-outline-primary" onClick={toggleSelectEnabled}>Toggle Select</button>
                        {!!selectedItems.length && (
                            <button type="button" className="btn btn-outline-danger" onClick={deleteSelectedPosts}>
                                <i className="material-icons">delete</i>
                            </button>
                        )}
                        <button type="button" className="btn btn-primary">
                            <i className="material-icons">add</i>
                            <span>Add New</span>
                        </button>
                    </div>
                </h1>
                <div className="items">
                    <ul>
                        {items.map(({ id, title }) => {
                            return (
                                <li key={id} onClick={() => {}/*history.push(`/sites/${id}`)*/}>
                                    <div className="left-align">
                                        {selectEnabled && (
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input position-static"
                                                    type="checkbox"
                                                    onChange={() => toggleSelectCheck(id)}
                                                />
                                            </div>
                                        )}
                                        <div className="site-title clickable">{title}</div>
                                    </div>
                                    <div className="right-align">
                                        <i className="material-icons clickable mr-3">edit</i>
                                        <i className="material-icons clickable">delete</i>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ListPosts;