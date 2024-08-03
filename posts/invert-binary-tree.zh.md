---
title: 翻转二叉树
date: "2017-12-22"
description: "Homebrew 作者也无法办到的事。"
tags: programming
---

来自 LeetCode 的经典算法题：翻转二叉树

> 给你一棵二叉树的根节点 root ，翻转这棵二叉树，并返回其根节点。

有如下输入:

```plaintext
     4
   /   \
  2     7
 / \   / \
1   3 6   9
```

期望输出结果是这样:

```plaintext
     4
   /   \
  7     2
 / \   / \
9   6 3   1
```

该问题由此[推文/X](https://twitter.com/mxcl/status/608682016205344768)所启发.

<div>
    <tweet id="608682016205344768" />
</div>

以下为 Java 的实现。

```java
/**
 * Definition for a binary tree node.
 * public class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode(int x) { val = x; }
 * }
 */
class Solution {
    public TreeNode invertTree(TreeNode root) {
        if(null != root){
            TreeNode leftChild = root.left;
            root.left = root.right;
            root.right = leftChild;
            root.left = invertTree(root.left);
            root.right = invertTree(root.right);
        }
        return root;
    }
}
```

软件工程和计算机科学有很大的区别。[后来 Max 在 Quara 上回应了这个问题。](https://bit.ly/2HqaTe5)
