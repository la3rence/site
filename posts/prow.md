---
title: "在 Kubernetes 中部署 Prow"
date: "2020-11-29"
themeColor: "#306de6"
image: "prow/k8s.jpg"
description: "Kubernetes 原生 CI/CD 系统 `Prow`。GitHub CI 🤖️ by Kubernetes. @k8s-ci-bot"
tags: Kubernetes, CI, Robot, DevOps, GitHub
---

### **Prow** | praʊ |

_noun_. _the pointed front part of a ship; the bow. 船首._

了解 Prow 可以参考这篇知乎专栏：[Kubernetes 原生 CI/CD 系统 Prow 简介](https://zhuanlan.zhihu.com/p/65545774)。

本文重点参考了以下文章，并做了一些问题的修复：

- [Prow Tutorial - KubeSphere‘s Github Repo](https://github.com/kubesphere/prow-tutorial)
- [DevOps 工具链之 Prow](https://www.chenshaowen.com/blog/prow-of-devops-tool-chain.html)

我们并不一定需要使用 Bazel 来构建配置。笔者使用的 Kubernetes 版本为 2020 年发布的 1.19.3。一切的前提是拥有一个 Kubernetes 集群，最好在里面也部署一个 Ingress Controller
用来暴露我们的 WebHook 以及 Prow Deck 前端 Dashboard 服务。

在 K8s 集群中部署 Prow 的具体步骤如下：

首先注册一个 GitHub 账号专门用于作为机器人账号，用此账号前往 [GitHub Developer 页面](https://github.com/settings/tokens)创建一个 Token，权限参考上文，并邀请此账号作为
Collaborators 管理仓库。

随机生成 H-MAC 作为 WebHook 密码安全验证。

```yaml
openssl rand -hex 20 > hmac
```

将他们保存在 `/etc/github/oauth` 和 `/etc/webhook/hmac` 文件下。路径不能错误，因为此处和下面的 Prow manifest 字段匹配。

纳入集群对象：

```bash
kubectl create secret generic hmac-token --from-file=hmac=/etc/webhook/hmac
kubectl create secret generic oauth-token --from-file=oauth=/etc/github/oauth
```

将[以下 Prow 的 manifest](https://gist.github.com/la3rence/79ba7d87cb8a3a44916162d4dece0c66) 做简单修改，注意 Ingress 的域名，namespace 为 `default`：

`gist:la3rence/79ba7d87cb8a3a44916162d4dece0c66`

apply 上述 manifest。过程可能持续几分钟。上面用到的镜像都来自 DockerHub，国内可以直接访问。出现问题尝试打印 Pod 日志或者 describe，用好 Google 和 GitHub 能解决几乎 99% 的技术问题。

```bash
curl -L https://bit.ly/prow -o prow.yaml
vi prow.yaml
kubectl apply -f prow.yaml
```

### **Deck** | dɛk |

_noun._ 甲板

等 Pod 全都 Running 后，项目就成功了一半！现在直接访问 Prow 的 Ingress 地址，可以看到 Prow 的 Deck 前端
Dashboard，类似于：[https://prow.k8s.io/](https://prow.k8s.io/) 。

这时，可以在 GitHub 的项目设置里去添加 WebHook:

1. Payload URL 是你的 Prow Ingress 域名后面直接加 `/hook`
2. Content Type 选择 `application/json`
3. Secrets 是上面随机生成的 HMAC
4. 勾选 `Send me everything`

激活并保存。

接着在集群机器上创建一个 `plugins.yaml` 文件和 `config.yaml` 文件来配置 Prow。

插件的声明：

```yaml
plugins:
  GitHub账号/项目名:
    - size
    - cat
    - dog
    - pony
    - shrug
    - yuks
    - label
    - trigger
    - approve
    - lgtm
    - welcome
    - help
    - assign
    - branchcleaner
    - lifecycle
    - wip
    - heart
    - milestone
    - milestonestatus
    - project
    - stage
    - skip
    - blockade
```

Tide 的配置：

```yaml
prowjob_namespace: "default"
tide:
  merge_method:
    kubeflow/community: squash

  target_url: http://你的域名/tide
  queries:
    - repos:
        - GitHub账号/项目名
      labels:
        - lgtm
        - approved
      missingLabels:
        - do-not-merge
        - do-not-merge/hold
        - do-not-merge/work-in-progress
        - needs-ok-to-test
        - needs-rebase

  context_options:
    from-branch-protection: true
    skip-unknown-contexts: true
    orgs:
      org:
        required-contexts:
          - "check-required-for-all-repos"
        repos:
          repo:
            required-contexts:
              - "check-required-for-all-branches"
            branches:
              branch:
                from-branch-protection: false
                required-contexts:
                  - "required_test"
                optional-contexts:
                  - "optional_test"
```

应用更改：

```bash
kubectl create configmap plugins \
--from-file=plugins.yaml=/root/cluster/prow/plugins.yaml --dry-run -o yaml \
| kubectl replace configmap plugins -f -

kubectl create configmap config \
--from-file=config.yaml=/root/cluster/prow/config.yaml --dry-run -o yaml \
| kubectl replace configmap config -f -
```

可能需要两分钟生效。等一切就绪后，就可以创建 Pull Request 来测试了。效果可以参考 [Kubernetes 的官方仓库](http://github.com/kubernetes/kubernetes)或[我的这个 node
命令行翻译项目](https://github.com/la3rence/Tranclite/pull/5)。

### 使用 Prow

在 GitHub 的 Issue 或 Pull Request 页面下你可以用一个简单的 `/meow` 命令让机器人随机发送一张 🐱 的图片。无需任何刷新，GitHub 页面会自动地更新此页面（后来发现是基于 WebSocket）：

![cat-in-issue](/images/prow/1.png#wide)

我们注意到， Kubernetes 维护人员会使用 `/test` 命令来让集群内的 Pod 执行测试并将结果告诉 GitHub，这就是 ProwJob 实现的了。

ProwJob 主要用于 PR 流程的 CI 测试，而国内网络原因无法使用 Google 的 GCS 服务，ProwJob 中 plank
依赖的 [Pod Utilities](https://github.com/kubernetes/test-infra/blob/master/prow/jobs.md#pod-utilities)，其中定义 GCS Bucket
用于存放构建产物、日志等内容，因此，我们似乎只能自己用自定义的镜像来跑临时 CI 任务了。注意定义 presubmit 字段下的 decorate 为
false，并利用好 [Prow 提供的一些环境变量](https://github.com/kubernetes/test-infra/blob/master/prow/jobs.md#job-environment-variables)。

下面是我的一个简单的 Spring Boot 项目利用 [Maven 镜像（配合阿里云的 Maven Repo）](https://hub.docker.com/r/lawrence2018/aliyun-maven)来做的
presubmits，同样在 config.yaml 中添加：

```yaml
presubmits:
  la3rence/kubernetes-springboot-demo:
    - name: spring
      decorate: false
      always_run: false
      spec:
        containers:
          - image: lawrence2018/maven:3.6-jdk-8
            command: ["/bin/sh", "-c"]
            args:
              - |
                mkdir -p /${REPO_NAME}
                cd /${REPO_NAME}
                git init
                git remote add origin https://github.com/${REPO_OWNER}/${REPO_NAME}.git
                git fetch origin pull/${PULL_NUMBER}/head:pr-${PULL_NUMBER}
                git checkout pr-${PULL_NUMBER}
                mvn test
            resources:
              requests:
                cpu: "2000m"
                memory: "1536Mi"
```

重新配置 config 后并应用更改，在 Pull Request 下评论 `/test all` 或者 `/test spring`
来触发测试。[参考此 PR](https://github.com/la3rence/kubernetes-springboot-demo/pull/4)。

`/test` 后面加 presubmits 的 name 名可触发指定的测试 Pod，all 则测试全部。测试若失败，可使用 `/retest` 来重新测试。

![Prow-in-Pull-Request-Test.png](/images/prow/2.png#wide)

如果测试通过，可使用 `/lgtm` 触发 tide 让机器人合并代码（注意自己不能 `/lgtm`）。

### 自研 Issue/PR Bot

GitHub 大规模使用 WebSocket 来动态修改 Issue 或 PR 页面的 DOM，在视觉上非常令人享受。笔者后来也参考 Prow 用 Go
写了一个简单了 [OpsBot](https://github.com/la3rence/OpsBot) 帮助自己的仓库做一些简单的 PR、Issue 的管理，现已开源，欢迎任何 Issue / PR！

<div>
  <github user="la3rence" repo="OpsBot"></github>
</div>
