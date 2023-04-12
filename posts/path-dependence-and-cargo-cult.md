---
title: "路径依赖与货物崇拜"
date: "2019-03-12"
description: "关于职业规划的思考——软件工程师如何避免陷入路径依赖与货物崇拜编程。"
tags: viewpoint, career
---

路径依赖原本是经济学中的一个名词，我并不深知其具体领域的定义，但用通俗的话来解释起来非常简单：过去的决策将会限制、缩小未来的可选择性。

笔者首次了解「路径依赖」是源于 BYVoid 的博客文章—— [在 Google 的这四年](https://byvoid.com/zhs/blog/4-years-at-google-4/)。类比成贪心算法的局限，他提出的解决方案是模拟退火:

> 模拟退火算法的理念是在初期引入随机性，随着迭代次数的增加而减小随机因子，这样最终收敛到全局最优解的机率更大。跟随这个理念来考虑职业的选择，我决定跳出现有的路径，哪怕是这个路径的前方一片光明，现在只是为了体验不同的选择。

再讲一个宗教故事。

二战期间，美军在太平洋的塔纳岛上建了一个临时基地。岛上原住民看到美军的战斗机，以为是「大铁鸟」。美军还会送一些有用的物资给岛上原住民。原住民没见过世面，都以为美军是神。后来，二战结束，美军撤走，还留了一点物资在岛上。岛上居民认为这些物资很神奇，相信这些美国大兵还会送货物过来，纷纷信仰、崇拜起了美军军服和物资（以吸引「大铁鸟」降临）。基于此，原住民发展出了自己的宗教—— 约翰弗鲁姆教。这就是货物崇拜（[Cargo Cult](https://zh.wikipedia.org/wiki/%E8%B2%A8%E7%89%A9%E5%B4%87%E6%8B%9C)）。

货物崇拜在软件工程领域延伸出了货物崇拜软件工程与货物崇拜编程。

货物崇拜软件工程是货物崇拜科学的一个实例。货物崇拜科学是诺奖得主 Richard Feynman 于 1974 年提出的一门伪科学概念。这种类似科学的方法论从道德上就背叛了科学精神。

以下为货物崇拜软件工程的主观实践：

- 盲目模仿成功开发团队的表面现象
- 机械套用软件开发过程却不知其由（即货物崇拜编程）

货物崇拜和路径依赖存在交集。具体表现在开发者的机械式开发。最常见的是：

- jQuery 一把梭

我发现有前端开发者会在使用 Vue/React 等基于 Virtual DOM 的声明式 UI Library 的情况下依旧使用 jQuery 操作 DOM。这是典型的货物崇拜编程实践，因为这样的开发人员完全不理解 Vue/React 是做什么的，因为已经习惯了 $ 的 API，哪管 DOM Virtual 不 Virtual；姑且撇开 Virtual DOM 的性能不说，这样做的开发人员往往也没能够理解[声明式](/blog/declarative-programming) UI 框架的内涵。

上文提到的「模拟退火」是破解路径依赖困境的法则之一。除此之外，笔者认为最适合大多数人的做法是对事物保持强烈的好奇心。正如 Aaron Swartz 所云：

> Be curious. Read widely. Try new things. What people call intelligence just boils down to curiosity.

一些链接：

- [如何「评价老夫写代码就用 jQuery 」[图]](https://www.zhihu.com/question/56085124)

- [维基百科：货物崇拜编程](https://zh.wikipedia.org/wiki/%E8%B4%A7%E7%89%A9%E5%B4%87%E6%8B%9C%E7%BC%96%E7%A8%8B)

- [Quote from Aaron Swartz](https://www.goodreads.com/quotes/709288-be-curious-read-widely-try-new-things-what-people-call)
