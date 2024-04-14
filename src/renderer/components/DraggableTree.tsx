import "./styles/DraggableTree.css";

import { Input, Tree } from "antd";
import React from "react";
import cx from "classnames";
import { noop } from "../services/utils";
import { flattenStructure, structureHasItem } from "../services/build";
import { IStructureItem } from "../../common/interfaces";

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
  showSearch?: boolean;
  showIcon?: boolean;
  titleRender?: any;
}

interface IState {
  gData: any;
  searchValue: string;
  autoExpandParent: boolean;
  itemsContainingSearch: React.Key[];
  expandedKeys: React.Key[];
  firstItemTitle: string;
  firstItemKey: string;
}

const { Search } = Input;

class DraggableTree extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);

    const firstItemKey = props.data?.[0]?.key;
    const firstItemTitle = props.data?.[0]?.title;

    this.state = {
      gData: props.data,
      searchValue: "",
      autoExpandParent: false,
      itemsContainingSearch: [],
      expandedKeys: [],
      firstItemKey,
      firstItemTitle
    };
  }

  onDragEnter = (info) => {};

  componentDidUpdate(nextProps) {
    const { data } = this.props;
    if (nextProps.data !== data) {
      if (data) {
        this.setState({ gData: data });
      }
    }
  }

  onDrop = async (info) => {
    const dropKey = info.node.props.eventKey;
    const dragKey = info.dragNode.props.eventKey;
    const dropPos = info.node.props.pos.split("-");
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
      loop(data, dropKey, (item) => {
        item.children = item.children || [];
        item.children.push(dragObj);
      });
    } else if (
      (info.node.props.children || []).length > 0 &&
      info.node.props.expanded &&
      dropPosition === 1
    ) {
      loop(data, dropKey, (item) => {
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
      typeof this.props.onDropCheck === "function" &&
      (await this.props.onDropCheck(data, dragKey));

    /**
     * dropCheck true = fail
     */
    if (dropCheck) {
      return;
    } else {
      this.setState(
        {
          gData: data,
        },
        this.props.onUpdate && this.props.onUpdate(data, dragKey)
      );
    }
  };

  onExpand = (newExpandedKeys: React.Key[]) => {
    this.setState({
      expandedKeys: newExpandedKeys,
      autoExpandParent: false
    })
  }

  getParentKey = (key: React.Key, tree: any[]): React.Key => {
    let parentKey: React.Key;
    for (let i = 0; i < tree.length; i++) {
      const node = tree[i];
      if (node.children) {
        if (node.children.some((item) => item.key === key)) {
          parentKey = node.key;
        } else if (this.getParentKey(key, node.children)) {
          parentKey = this.getParentKey(key, node.children);
        }
      }
    }
    return parentKey!;
  };

  onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    if(!value.trim()){
      this.setState({
        itemsContainingSearch: [],
        expandedKeys: [],
        searchValue: "",
      });
      return;
    }

    const items = this.state.gData?.[0]?.children || [];
    const flattenedStructure = flattenStructure(items);

    const itemsContainingSearch = flattenedStructure.filter(({ title }) => {
      const lowerTitle = title.toLowerCase();
      const lowerSearch = value.toLowerCase();
      return lowerTitle.includes(lowerSearch) || lowerTitle === lowerSearch;
    });

    const parentsOfItemsContainingSearch = flattenedStructure.filter(node => {
      const uuids = itemsContainingSearch.map(item => item.key);
      return structureHasItem(uuids, node);
    });

    const combinedItemsToExpand = [...itemsContainingSearch, ...parentsOfItemsContainingSearch];
    const expandedKeys = [...combinedItemsToExpand.map(({ key }) => key)];

    this.setState({
      itemsContainingSearch: itemsContainingSearch.map(({ key }) => key),
      expandedKeys,
      searchValue: value,
      autoExpandParent: true
    });
  }

  titleTextRender = node => {
    const isSearchResult = this.state.searchValue && this.state.itemsContainingSearch.includes(node.key);
    const isSearchPath = this.state.searchValue && this.state.expandedKeys.includes(node.key);
    return <span className={cx(
      "tree-title",
      isSearchResult && "tree-title-selected",
      isSearchPath && "tree-title-path"
      )}>
        {node.title}
      </span>
  }

  render() {
    const {
      onCheck = noop,
      onSelect = noop,
      checkable,
      checkedKeys = [],
      checkStrictly,
      titleRender,
      showSearch,
      showIcon
    } = this.props;

    return (
      <div className="draggable-tree">
        {showSearch ? <Search style={{ marginBottom: 8 }} placeholder="Search" onChange={this.onSearch} /> : null}
        <Tree
          showIcon={showIcon}
          titleRender={node => titleRender ? titleRender(node, this.titleTextRender(node)) : this.titleTextRender(node)}
          className="draggable-tree"
          draggable={this.props.draggable ?? true}
          blockNode
          onDragEnter={this.onDragEnter}
          onDrop={this.onDrop}
          treeData={this.state.gData}
          expandedKeys={[this.state.firstItemKey, ...this.state.expandedKeys]}
          onExpand={this.onExpand}
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
