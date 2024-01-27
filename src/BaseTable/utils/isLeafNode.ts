import { AbstractTreeNode } from '../interfaces'

// 是否是叶子节点
export default function isLeafNode(node: AbstractTreeNode) {
  return !Array.isArray(node?.children) || !node?.children.length
}
