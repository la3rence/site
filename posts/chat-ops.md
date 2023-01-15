---
title: "基于 Go 的 ChatOps 实践"
date: "2021-02-06"
description: "DevOps / ChatOps with Dingtalk by GoLang (bot) 钉钉机器人开发应用于运维自动化 Jenkins + WebHook + Git + Pull Request"
tags: DevOps, GoLang, ChatOps, CI/CD
---

聊着天就把活干了。

---

公司的运维一直由我来帮助实施。去年将所有微服务容器化后，运维的成本面临新的挑战。本着解放生产力的目标，顺带回忆不太熟悉的 Go 基本语法，笔者写了一个钉钉机器人来帮助我做一些运维的活。效果也不错，就把大体做法在这里讲讲。

做这个之前有一系列的必要（也可替换的）基础设施和概念以及 HTTP 服务端开发的认知，能实现这套聊天运维离不开每一个环节以及诸多细节。简单概括一下我是怎么实践的。

### 技术栈依赖

实践 ChatOps 至少需要的基础设施：一个 CI / CD 服务，一个暴露在公网的 HTTP 服务，一个远程 VCS 和一个能提供收发消息 API 的即时通信工具。

本项目采用：

- [Jenkins](https://www.jenkins.io/) (CI / CD，经典的持续集成工具，提供公网可访问的 REST API)
- [Git](https://git-scm.com/) (VCS，本项目使用公司正在用的 [Gitee.com](https://gitee.com) - 可使用 [GitHub.com](http://github.com) 或 GitLab，提供 REST API 或 SDK)
- [Serverless](https://vercel.com/docs/serverless-functions/introduction) (用来暴露核心的 HTTP 端点，只是无需运维而已；也不是必须，否则需要有公网服务器)
- DingTalk (限制[企业内部机器人](https://ding-doc.dingtalk.com/document/app/develop-enterprise-internal-robots)，能提供 WebHook 和收发消息的 SDK 即可，或其他类似 Slack 的聊天应用: 企业微信、飞书等等)

### 系统拓扑

![ChatOPS](/images/chat-ops/1.png)

懒汉只会和机器人以聊天的形式交互，[其余的脏活累活重复劳动交给机器人做](/blog/the-world-as-i-see-it)。大致流程如图，重点实现：

- 迎接聊天机器人的 HTTP 请求
- 根据请求文本触发行为
  - Git Workflow
    - Approve Pull Request
    - Test Pull Request
    - Merge Pull Request
    - Show PR list
  - CI / CD
    - CI Test
    - Deploy to Production

很显然，核心的开发工作的都在 Message Handler 那里。根据聊天机器人提供的 Event Hook（每次聊天机器人收到消息时会自动向某个服务器发送 HTTP 请求，会携带发送消息的用户、消息内容等 Payload），可以设计一个 HTTP 端点，在服务端解析这些请求（钉钉需要按照企业内部机器人开发，[参考这篇开发文档](https://ding-doc.dingtalk.com/document/app/develop-enterprise-internal-robots)）。

我们按照 [Kubernetes Prow 的设计语言](/blog/prow)，用一个 `/` 来作为 Tag，形式如同 `/test xxx` .

因此这里必然需要做字符串处理了。除了判断 Tag 的存在之外，要取 Tag 后面的参数。项目用 Go 实现，很简单。贴其中一工具函数的代码，各位猜猜这是做什么的：

```go
func StringIndexOf(originalArray []string, wordToFind interface{}) []int {
    length := len(originalArray)
    interfaceArray := make([]interface{}, length)
    for i, v := range originalArray {
        interfaceArray[i] = v
    }
    var indexArray []int
	for i:=0 ; i < length; i++ {
		if strings.Compare(wordToFind.(string), originalArray[i]) == 0 {
			indexArray = append(indexArray, i)
		}
	}
	return indexArray
}
```

拿到参数后继续判断，比如机器人收到了这个指令：

`/merge 233`

即合并第 #233 个 Pull Request。要通过代码来合并，那操作 Git 就需要 SDK 或接口了。考虑到之前写 [Issue Ops Bot](https://github.com/Lonor/OpsBot) 的经验，Google 开源的 GitHub 的 [Go-GitHub](https://github.com/google/go-github) 写起来很方便，Gitee 应该也有人搞吧？果然搜到了华为的 OpenEuler 团队的仓库：[Go-Gitee](http://gitee.com/openeuler/go-gitee)。看来只有大厂才会给这些基础设施写 SDK 啊！果断加依赖:

```sh
go get -u gitee.com/openeuler/go-gitee
```

版本下载下来给的时间戳居然就是这两天的，虽然没有任何测试代码，但看似更新蛮活跃，大胆直接用上了。后面写了一些接口，发现 SDK 提供的一些 API 也不全，比如没有审核通过 PR 和测试通过 PR 的 API，就自己顺带拿 `net/http` 参考着 [Gitee 的 REST API](https://gitee.com/api/v5/swagger) 自己实现了，但是代码太丑陋（本来想模仿项目的写法去写，但是一心只想把功能完成），也没给华为提 issue，等回头有机会写下给它提个 PR 嘿嘿（除此之外我还发现 Gitee 的合并方式没有 `rebase` 选项，只提供 `merge` 和 `squash` ，在所谓的社区企鹅群里和他们提了一下建议，理都不理)。

如果机器人收到类似这样的指令:

`/jenkins test myservice` 或 `/deploy myservice`

那就直接对接 [Jenkins 的 REST API](https://www.jenkins.io/doc/book/using/remote-access-api/) 了。可以直接凭状态码判断响应，安全方面 Jenkins 自身提供了 HTTP BASIC 认证。就不细说了。

之前没有用 Go 写过 HTTP Server，这次也没有写——如果运维一套服务已经很麻烦了，开发出的一套帮助运维的辅助服务本身也需要运维（公网服务器、域名解析、持续的测试和部署等服务器资源以及[注意力资源](https://zh.wikipedia.org/wiki/%E6%B3%A8%E6%84%8F%E5%8A%9B%E7%B6%93%E6%BF%9F)），我就没有使用传统的后端服务，而是使用了自己熟悉的 [Vercel Serveless for Go](https://vercel.com/docs/runtimes#official-runtimes/go)。公开一个 Handler 方法即可，`*http.Request` 结构体指针的 `Body` 就是机器人发来的消息了。

下面是整个 Handler 的大致逻辑，伪代码：

```go
func Handler(w http.ResponseWriter, r *http.Request) {
  defer fmt.Fprintf(w, "ok")
  chatMessage, _ := ioutil.ReadAll(r.Body)
  if strings.Contains(chatMessage, "/deploy") {
     serverName := getServerNameFromMessage(chatMessage)
     jenkinsSDK.deploy(serverName)
  }
  if strings.Contains(chatMessage, "/merge") {
     pullRequestNumber := getPullRequestNumberFromMessage(chatMessage)
     giteeSDK.mergePullRequest(pullRequestNumber)
  }
  ...
 }
```

期待某天 Vercel 能够支持 JVM 语言甚至是 Spring 的 Serverless。

### 效果

比如让机器人展示下仓库目前的 Pull Request，然后测试这个 PR，通过后批准这个 PR，最终合并 PR，上线生产，聊天记录会是这样的：

```txt
Users 命令: /pr
Robot 回复: 当前仓库的 PullRequest 列表...
          [#709] fix: typo
          [author] username

Users 命令: /jenkins test micro-server 709
Robot 回复: 开始测试 PullRequest 709
CIBot 回复:
          [jenkins] micro-server ci
          -------------------------
          任务：#666
          状态：开始
          持续时间：0 分 1 秒
          执行人：Host 76.76.21.21

Users 命令: /approve 709
Robot 回复: 审核通过 PullRequest #709

Users 命令: /merge 709
Robot 回复: 合并 PullRequest #709
Gitee 回复: User 接受了 Owner/repo 的 Pull Request !709 fix: typo

Users 命令: /deploy micro-server
Robot 回复: 生产发布 micro-server
CDBot 回复:
          [jenkins] micro-server cd
          -------------------------
          任务：#233
          状态：开始
          持续时间：0 分 1 秒
          执行人：Host 76.76.21.21

# 友好地提供帮助
Users 命令: /help
Robot 回复: 当前支持指令列表, 带 * 需要特定人员发起
          /pr - 展示仓库发起中的 PR
          /jenkins <action> <servername> <pr-number> - 在指定 PR 下发起后端测试
          /pass <pr-number> - * 测试通过指定 PR
          /approve <pr-number> - * 审核通过指定 PR
          /merge <pr-number> - * 合并指定 PR
          /test <servername> - 在仅有一个 PR 的状态下发起后端服务测试
          /deploy <servername> - * 发布服务至生产环境
          /help - 显示此帮助内容
```

代码写的很丑陋，没脸往外放了，而且也是企业内部使用，就不开源了（所有变量，十个左右，都配置在环境变量中，尽量没有 Hard Code）。

社区也有不少钉钉机器人的 SDK，阿里没有提供 Go 版本的，但写起来也不复杂，顺手提供自己写的[钉钉群机器人 Go 语言的 SDK](https://github.com/Lonor/dingtalkbot-sdk)，目前就只用来发文本消息。

<div>
  <github user="Lonor" repo="dingtalkbot-sdk"></github>
</div>

最近一次更新，让机器人支持了多个仓库，直接在 `/tag` 最后加一个可选参数 `[repo]`，然后 SDK 的参数做出相应的变动就实现了。

相关链接：

- [Pattern#ChatOps from Ledge —— DevOps knowledge learning platform](https://devops.phodal.com/pattern#chatops)
