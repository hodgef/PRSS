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
    selectedKeys?: string[];
    checkStrictly?: boolean;
    draggable?: boolean;
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
            console.log('nextProps', nextProps);
            if (data) {
                this.setState({ gData: nextProps.data });
            }
        }
    }

    onDrop = info => {
        const dropKey = info.node.props.eventKey;
        const dragKey = info.dragNode.props.eventKey;
        const dropPos = info.node.props.pos.split('-');
        const dropPosition =
            info.dropPosition - Number(dropPos[dropPos.length - 1]);

        /**
         * Don't allow root level drop
         */
        if (dropPos.length === 2) {
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

        this.setState(
            {
                gData: data
            },
            this.props.onUpdate && this.props.onUpdate(data)
        );
    };

    render() {
        const {
            onCheck = noop,
            onSelect = noop,
            checkable,
            selectedKeys = [],
            checkStrictly
        } = this.props;

        console.log('selectedKeys', selectedKeys);

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
                    onCheck={(chk: any) =>
                        checkStrictly ? onCheck(chk.checked) : onCheck(chk)
                    }
                    showLine
                    checkable={checkable}
                    selectedKeys={selectedKeys}
                    checkStrictly={checkStrictly}
                />
            </div>
        );
    }
}

export default DraggableTree;
