import './styles/MenuEditor.scss';

import React, { Fragment, FunctionComponent, useState, useEffect } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { walkStructure, findInStructure } from '../services/build';
import { deleteMenuEntries } from '../services/hosting';
import DraggableTree from './DraggableTree';
import Footer from './Footer';
import Header from './Header';
import { ask } from '../services/utils';
import { getSite, getItems, updateSite } from '../services/db';

const MenuEditor: FunctionComponent = () => {
    const { siteId, menuId } = useParams();

    const [site, setSite] = useState(null);
    const [items, setItems] = useState(null);
    const { title } = (site as ISite) || {};
    const [formattedStructure, setFormattedStructure] = useState(null);
    const [formattedMenuStructure, setFormattedMenuStructure] = useState(null);

    const [menuState, setMenuState] = useState(null);
    const [menuChanged, setMenuChanged] = useState(false);

    const history = useHistory();
    const [selectEnabled, setSelectEnabled] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        const getData = async () => {
            const siteRes = await getSite(siteId);
            const itemsRes = await getItems(siteId);
            const menu = siteRes.menus[menuId];

            setSite(siteRes);
            setItems(itemsRes);
            setFormattedStructure(
                await walkStructure(siteId, siteRes.structure, ({ title }) => ({
                    title
                }))
            );
            handleMenuUpdate(menu);
        };
        getData();
    }, []);

    const handleMenuUpdate = async menuState => {
        setMenuState(menuState);
        setFormattedMenuStructure(
            await walkStructure(siteId, menuState, ({ title }) => ({
                title
            }))
        );
    };

    if (!site || !items || !menuState || !formattedStructure) {
        return null;
    }

    const toggleSelectEnabled = () => setSelectEnabled(!selectEnabled);

    const deleteSelectedMenuEntries = async () => {
        const deleteRes = await deleteMenuEntries(
            siteId,
            menuId,
            selectedItems
        );

        if (deleteRes) {
            toast.success('Menu entries deleted!');
            setSelectedItems([]);
            setSelectEnabled(false);
            handleMenuUpdate(deleteRes);
        } else {
            toast.error('No deletion made');
        }
    };

    const onItemClick = itemId => {};

    const formatStructureOptions = (node, options = [], parents = []) => {
        const indent = parents.map(() => '--').join('') + ' ';

        options.push(
            <option
                value={node.key}
                key={node.key}
                disabled={findInStructure(node.key, menuState)}
            >
                {indent}
                {node.title}
            </option>
        );

        if (node.children) {
            node.children.forEach(childrenNode => {
                formatStructureOptions(childrenNode, options, [
                    ...parents,
                    node.key
                ]);
            });
        }

        return options;
    };

    const formattedStructureOptions = formattedStructure.length
        ? formatStructureOptions(formattedStructure[0])
        : null;

    const addNew = async () => {
        const renderInput = onChange => {
            return (
                <select
                    className="form-control form-control custom-select mt-2"
                    onChange={onChange}
                >
                    <option value="">-- None --</option>
                    {formattedStructureOptions}
                </select>
            );
        };

        const postId = (await ask({
            title: '',
            message: <Fragment>Select a post to add:</Fragment>,
            buttons: [{ label: 'Continue' }],
            renderInput
        })) as string;

        if (!postId.trim()) {
            toast.error('A post must be provided to proceed. Cancelling.');
            return;
        }

        const newMenuState = [
            ...menuState,
            {
                key: postId,
                children: []
            }
        ];

        handleMenuUpdate(newMenuState);
        setMenuChanged(true);
        setSelectedItems([]);
    };

    const handleSave = async () => {
        const cleanedStructure = await walkStructure(siteId, menuState);
        const { menus } = await getSite(siteId);

        const updatedAt = Date.now();
        const updatedMenus = { ...menus, [menuId]: cleanedStructure };
        const updatedSite = { ...site, menus: updatedMenus, updatedAt };

        /**
         * Update site updatedAt
         */
        await updateSite(siteId, {
            menus: updatedMenus,
            updatedAt
        });

        setSite(updatedSite);
        handleMenuUpdate(cleanedStructure);

        toast.success('Menu saved successfully');
    };

    const onMenuUpdate = data => {
        handleMenuUpdate(data);
        setMenuChanged(true);
    };

    return (
        <div className="MenuEditor page fixed">
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
                        <div className="align-center">
                            <i className="material-icons">
                                keyboard_arrow_right
                            </i>
                            <Link to={`/sites/${siteId}/menus/${menuId}`}>
                                {menuId}
                            </Link>
                        </div>
                    </Fragment>
                }
            />
            <div className="content">
                <h1>
                    <div className="left-align">
                        <i
                            className="material-icons clickable"
                            onClick={() => history.goBack()}
                        >
                            arrow_back
                        </i>
                        <span>Menu: {menuId}</span>
                    </div>
                    <div className="right-align">
                        {!!items.length && (
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
                                onClick={() => deleteSelectedMenuEntries()}
                            >
                                <i className="material-icons">delete</i>
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => addNew()}
                        >
                            <i className="material-icons">add</i>
                            <span>Add Item</span>
                        </button>
                        {menuChanged && (
                            <button
                                type="button"
                                className="btn btn-primary mr-2"
                                onClick={() => handleSave()}
                            >
                                <span className="material-icons mr-2">
                                    save
                                </span>
                                <span>Save</span>
                            </button>
                        )}
                    </div>
                </h1>
                <div className="items">
                    <DraggableTree
                        checkable={selectEnabled}
                        data={formattedMenuStructure}
                        onSelect={items => items[0] && onItemClick(items[0])}
                        onUpdate={onMenuUpdate}
                        selectedKeys={selectedItems}
                        onCheck={setSelectedItems}
                        checkStrictly
                        noRootParent={true}
                    />
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default MenuEditor;
