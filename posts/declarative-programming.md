---
title: "声明式编程"
date: "2019-12-29"
---

写 YAML 上瘾了。

---

命令式编程注重过程，声明式编程注重结果。前者强调代码本身的逻辑，需要开发者重视程序的上下文，以一步一步地实现应用功能。后者基于完善的 API / SDK，告诉（声明）程序需要达到的状态，程序会主动向其驱动以达到声明的目标，有时甚至无需在意底层实现。

优雅的 API 往往是声明式的，通常也非常简洁明了。

这里我举一个电风扇和空调的例子：

电风扇：为了实现体表温度的控制，人类利用电动机发明了电风扇，一个命令式风速调节客户端 —— 大部分你需要自己手动地调节电风扇的风向、风速，让身体接受风扇的水平气压梯度力，以让体表流体流动速度上升从而达到吸热的目的。你可能已经间接地知道了它的实现**原理**，尽管这个流程并不复杂。

空调：它是声明式的。你**无需关注**空调自身的实现原理，只需要通过遥控器**声明**它应当达到的温度即可，空调就会驱动自身来实现密闭空间的恒温调节到达期望值 —— 哪怕空间的温度骤变。

虽然栗子并不够恰当，但是我们拥有了倾向意识：空调调节起来多简单方便！

软件开发亦如此。

我们其实早已经频繁地和声明式编程打交道了：其实 HTML、CSS、SQL 这些语言自己就是声明式语言；纯函数编程语言也被认为是声明式语言，这非常有趣。另外，前端流行的 React、Vue 都利用了 Virtual DOM 和 diff 算法实现了声明式的 JavaScript 用户界面框架，再也不需要前端开发者去使用 jQuery 或原生写法来操作 DOM。

Java 开发者在开发阶段使用声明式 API 的最典型例子就是运用注解。比如 Spring 提供 `@Autowired` 注解实现 Bean 的依赖注入，其实现是基于 Java 语言的反射。Spring 更是提供了大量内置的注解简化了开发人员的开发: `@Transactional` 实现声明式事务, `@Component` , `@Value`, `@Data` ...

首个毕业于 CNCF 的项目 [Kubernetes](https://k8s.io) 中也在充分地让 DevOps 拥抱声明式。它提供了给予 YAML 语法的配置文件（用以描述容器集群的拓扑状态），自动地向配置的声明驱动。云原生应用的一个必要特性就是声明式。

GraphQL 让原本的 REST 更加声明式。这是一个非常适合全栈开发的 HTTP 接口规范，热度最近有在攀升，能否颠覆 REST 不得而知。

Apple 在 WWDC 2019 上发布的 [SwiftUI](https://developer.apple.com/cn/xcode/swiftui/) 和 Google 开源的 [Flutter](https://flutter.cn/docs/get-started/flutter-for/declarative) 一样都是移动端的原生声明式 UI 框架。

Maven、Gradle、npm、yarn、pip、go module 等提供了 Java、JavaScript / TypeScript、Python、GoLang 开发者声明式依赖管理工具，现代的应用开发几乎离不开它们。

GitHub、GitLab、Jenkins Pipeline 提供了基于声明式配置文件（大部分为 YAML）的持续集成流水线，可以让开发人员也能低成本地学习实践 CI/CD。

开发声明式 API 是很困难的，往往需要开发人员对语言以及框架的拥有深刻认知，并且是一种的利他主义美德:

> 将复杂留给自己，将方便留给别人。

单纯作为用户而言，效率、便利、无副作用是声明式 API 的目的。而作为软件开发者，去意识到这些声明式应用或框架的背后原理往往会更加明白创作者的真实意图，也能更清晰自己所做的声明、或是充分优化应用层代码，而避免陷入[路径依赖与货物崇拜编程](https://lawrenceli.me/blog/path-dependence-and-cargo-cult)的怪圈。

Links:

[https://spring.io/guides/gs/rest-service/](https://spring.io/guides/gs/rest-service/)

[https://www.infoq.cn/article/rest-apis-are-rest-in-peace-apis-long-live-graphql](https://www.infoq.cn/article/rest-apis-are-rest-in-peace-apis-long-live-graphql)

[https://kubernetes.io/zh/docs/tasks/manage-kubernetes-objects/declarative-config/](https://kubernetes.io/zh/docs/tasks/manage-kubernetes-objects/declarative-config/)
