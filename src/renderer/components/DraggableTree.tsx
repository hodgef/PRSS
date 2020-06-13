import './styles/DraggableTree.scss';

import { Tree } from 'antd';
import React from 'react';

import { noop } from '../services/utils';

interface IProps {
    checkable?: boolean;
    data?: IStructureItem[];
    onUpdate?: any;
    onCheck?: any;
    onSelect?: any;
    onDropCheck?: any;
    checkedKeys?: string[];
    checkStrictly?: boolean;
    draggable?: boolean;
    noRootParent?: boolean;
}

interface IState {
    gData: any;
    expandedKeys: any;
}

class DraggableTree extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            gData: props.data,
            expandedKeys: []
        };
    }

    onDragEnter = info => {};

    componentDidUpdate(nextProps) {
        const { data } = this.props;
        if (nextProps.data !== data) {
            if (data) {
                this.setState({ gData: data });
            }
        }
    }

    onDrop = async info => {
        const dropKey = info.node.props.eventKey;
        const dragKey = info.dragNode.props.eventKey;
        const dropPos = info.node.props.pos.split('-');
        const dropPosition =
            info.dropPosition - Number(dropPos[dropPos.length - 1]);

        /**
         * Don't allow root level drop
         */
        if (dropPos.length === 2 && !this.props.noRootParent) {
            return;
        }

        const loop = (data, key, callback) => {
            data.forEach((item, index, arr) => {
                if (item.key === key) {
                    return callback(item, index, arr);
                }
                if (item.children) {
                    return loop(item.children, key, callback);
                }
            });
        };
        const data = [...this.state.gData];

        let dragObj;
        loop(data, dragKey, (item, index, arr) => {
            arr.splice(index, 1);
            dragObj = item;
        });

        if (!info.dropToGap) {
            loop(data, dropKey, item => {
                item.children = item.children || [];
                item.children.push(dragObj);
            });
        } else if (
            (info.node.props.children || []).length > 0 &&
            info.node.props.expanded &&
            dropPosition === 1
        ) {
            loop(data, dropKey, item => {
                item.children = item.children || [];
                item.children.unshift(dragObj);
            });
        } else {
            let ar;
            let i;
            loop(data, dropKey, (item, index, arr) => {
                ar = arr;
                i = index;
            });
            if (dropPosition === -1) {
                ar.splice(i, 0, dragObj);
            } else {
                ar.splice(i + 1, 0, dragObj);
            }
        }

        const dropCheck =
            typeof this.props.onDropCheck === 'function' &&
            (await this.props.onDropCheck(data, dragKey));

        /**
         * dropCheck true = fail
         */
        if (dropCheck) {
            return;
        } else {
            this.setState(
                {
                    gData: data
                },
                this.props.onUpdate && this.props.onUpdate(data, dragKey)
            );
        }
    };

    render() {
        const {
            onCheck = noop,
            onSelect = noop,
            checkable,
            checkedKeys = [],
            checkStrictly
        } = this.props;

        return (
            <div className="draggable-tree">
                <Tree
                    className="draggable-tree"
                    defaultExpandAll
                    draggable={this.props.draggable ?? true}
                    blockNode
                    onDragEnter={this.onDragEnter}
                    onDrop={this.onDrop}
                    treeData={this.state.gData}
                    onSelect={onSelect}
                    onCheck={(chk: any) => {
                        const checked = checkStrictly ? chk.checked : chk;
                        onCheck(checked);
                    }}
                    showLine
                    checkable={checkable}
                    checkedKeys={checkedKeys}
                    selectedKeys={[]}
                    checkStrictly={checkStrictly}
                />
            </div>
        );
    }
}

export default DraggableTree;
