---
title: Invert binary tree
date: "2017-12-22"
description: "the author of Homebrew can't do."
tags: Programming
---

A problem that Homebrew's author complained.

---

Invert a binary tree. Problem from leetcode.

Here's the input:

```txt
     4
   /   \
  2     7
 / \   / \
1   3 6   9
```

and the out put looks like:

```txt
     4
   /   \
  7     2
 / \   / \
9   6 3   1
```

This problem was inspired by this tweet:

[https://twitter.com/mxcl/status/608682016205344768](https://twitter.com/mxcl/status/608682016205344768)

Here's the solution implemented in Java.

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

There's much different logic behind software engineering with computer science. [Max replied this question about it on quora.com after 2 years.](https://bit.ly/2HqaTe5)
