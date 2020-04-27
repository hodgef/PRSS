import './styles/MenuEditor.scss';

import React, { Fragment, FunctionComponent, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { get, set } from '../../common/utils';
import { walkStructure, findInStructure } from '../services/build';
import { deleteMenuEntries } from '../services/hosting';
import DraggableTree from './DraggableTree';
import Footer from './Footer';
import Header from './Header';
import { ask } from '../services/utils';

const MenuEditor: FunctionComponent = () => {
    const { siteId, menuId } = useParams();
    const { items, title, structure } = get(`sites.${siteId}`);

    const rawMenu = get(`sites.${siteId}.menus.${menuId}`);
    const menu = rawMenu && rawMenu.length ? rawMenu : [];

    const [menuState, setMenuState] = useState(menu);
    const [menuChanged, setMenuChanged] = useState(false);

    const history = useHistory();
    const [selectEnabled, setSelectEnabled] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);

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
            setMenuState(deleteRes);
        } else {
            toast.error('No deletion made');
        }
    };

    const onItemClick = itemId => {};

    const renderItem = item => ({
        title: item.title
    });

    const formattedStructure = walkStructure(
        siteId,
        structure,
        ({ title }) => ({ title })
    );

    const formatStructureOptions = (node, options = [], parents = []) => {
        const indent = parents.map(() => '--').join('') + ' ';

        options.push(
            <option
                value={node.key}
                key={node.key}
                disabled={findInStructure(siteId, node.key, menuState)}
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

    const formattedStructureOptions = formatStructureOptions(
        formattedStructure[0]
    );

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

        setMenuState(newMenuState);
        setMenuChanged(true);
        setSelectedItems([]);
    };

    const handleSave = async () => {
        const cleanedStructure = walkStructure(siteId, menuState);
        await set(`sites.${siteId}.menus.${menuId}`, cleanedStructure);
        toast.success('Menu saved successfully');
    };

    const onMenuUpdate = data => {
        setMenuState(data);
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
                        data={walkStructure(siteId, menuState, renderItem)}
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
