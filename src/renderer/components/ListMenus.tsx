import './styles/ListMenus.scss';

import React, { FunctionComponent, useState, Fragment } from 'react';
import { useHistory, useParams, Link } from 'react-router-dom';

import { get, set } from '../../common/utils';
import Footer from './Footer';
import Header from './Header';
import { toast } from 'react-toastify';
import { deleteMenus } from '../services/hosting';
import DraggableTree from './DraggableTree';
import { ask, normalizeStrict } from '../services/utils';

const ListMenus: FunctionComponent = () => {
    const { siteId } = useParams();
    const { title, menus, items } = get(`sites.${siteId}`);
    const history = useHistory();

    const [selectEnabled, setSelectEnabled] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);

    const toggleSelectEnabled = () => setSelectEnabled(!selectEnabled);

    const deleteSelectedMenus = async () => {
        if (
            selectedItems.some(item =>
                ['header', 'sidebar', 'footer'].includes(item)
            )
        ) {
            toast.error(
                'You cannot delete the header, sidebar or footer menus'
            );
            setSelectedItems(prevItems => [
                ...prevItems.filter(item => item !== 'default')
            ]);
            return;
        }

        const deleteSuccess = await deleteMenus(selectedItems);

        if (deleteSuccess) {
            toast.success('Menus deleted!');
            setSelectedItems([]);
            setSelectEnabled(false);
        } else {
            toast.error('No deletion made');
        }
    };

    const addNew = async () => {
        const menuName = (await ask({
            title: '',
            message: <Fragment>Menu name:</Fragment>,
            buttons: [{ label: 'Continue' }]
        })) as string;

        if (!menuName.trim()) {
            toast.error('A menu name must be provided to proceed. Cancelling.');
            return;
        }

        const sanitizedMenuName = normalizeStrict(menuName);

        /**
         * Ensure menu doesn't already exist
         */
        const existingMenu = await get(
            `sites.${siteId}.menus.${sanitizedMenuName}`
        );

        if (existingMenu) {
            /**
             * Menu already exists
             */
            toast.error(
                `A menu with the name "${existingMenu}" already exists. Please choose another name`
            );
            return;
        }

        /**
         * Create menu
         */
        await set(`sites.${siteId}.menus.${sanitizedMenuName}`, []);

        /**
         * Redirect to menu editor
         */
        history.push(`/sites/${siteId}/menus/${sanitizedMenuName}`);

        toast.success(`Menu "${sanitizedMenuName}" created!`);
    };

    const formatMenus = rawMenusObj => {
        const keys = Object.keys(rawMenusObj) as [];
        return keys.map(name => ({
            key: name,
            title: (
                <Fragment>
                    <div className="left-align">
                        <div className="site-title">{name}</div>
                    </div>
                    <div className="right-align"></div>
                </Fragment>
            ),
            children: []
        }));
    };

    const onItemClick = itemId => {
        history.push(`/sites/${siteId}/menus/${itemId}`);
    };

    return (
        <div className="ListMenus page">
            <Header
                undertitle={
                    <Fragment>
                        <div className="align-center">
                            <i className="material-icons">public</i>
                            <Link to={`/sites/${siteId}`}>{title}</Link>
                        </div>
                        <div className="align-center">
                            <i className="material-icons">
                                keyboard_arrow_right
                            </i>
                            <Link to={`/sites/${siteId}/menus`}>Menus</Link>
                        </div>
                    </Fragment>
                }
            />
            <div className="content">
                <h1>
                    <div className="left-align">
                        <span>Menus</span>
                    </div>
                    <div className="right-align">
                        {!!Object.keys(menus).length && (
                            <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={toggleSelectEnabled}
                            >
                                Toggle Select
                            </button>
                        )}
                        {!!selectedItems.length && (
                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => deleteSelectedMenus()}
                            >
                                <i className="material-icons">delete</i>
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={async () => addNew()}
                        >
                            <i className="material-icons">add</i>
                            <span>Create New</span>
                        </button>
                    </div>
                </h1>
                <div className="items">
                    <DraggableTree
                        checkable={selectEnabled}
                        data={formatMenus(menus)}
                        onSelect={items => items[0] && onItemClick(items[0])}
                        selectedKeys={selectedItems}
                        onCheck={setSelectedItems}
                        draggable={false}
                        checkStrictly
                    />
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ListMenus;
