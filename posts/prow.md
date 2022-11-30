---
title: "在 Kubernetes 中部署 Prow"
date: "2020-11-29"
description: "Kubernetes 原生 CI/CD 系统。@k8s-ci-bot"
tag: Kubernetes, CI, Robot, DevOps
---

GitHub CI 🤖️ by Kubernetes

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

将[以下 Prow 的 manifest](https://gist.github.com/Lonor/79ba7d87cb8a3a44916162d4dece0c66) 做简单修改，注意 Ingress 的域名，namespace 为
default：

```yaml
# This file contains Kubernetes YAML files for the most important prow
# components. Don't edit resources in this file. Instead, pull them out into
# their own files.
---
apiVersion: v1
kind: ConfigMap
metadata:
  namespace: default
  name: plugins
data:
  plugins.yaml: ""
---
apiVersion: v1
kind: ConfigMap
metadata:
  namespace: default
  name: config
data:
  config.yaml: |
    prowjob_namespace: default
    pod_namespace: test-pods
    periodics:
    - interval: 10m
      agent: kubernetes
      name: echo-test
      spec:
        containers:
        - image: alpine
          command: ["/bin/date"]
---
apiVersion: apiextensions.k8s.io/v1beta1
kind: CustomResourceDefinition
metadata:
  name: prowjobs.prow.k8s.io
spec:
  group: prow.k8s.io
  version: v1
  names:
    kind: ProwJob
    singular: prowjob
    plural: prowjobs
  scope: Namespaced
  validation:
    openAPIV3Schema:
      properties:
        spec:
          properties:
            max_concurrency:
              type: integer
              minimum: 0
            type:
              type: string
              enum:
                - "presubmit"
                - "postsubmit"
                - "periodic"
                - "batch"
        status:
          properties:
            state:
              type: string
              enum:
                - "triggered"
                - "pending"
                - "success"
                - "failure"
                - "aborted"
                - "error"
          anyOf:
            - not:
                properties:
                  state:
                    type: string
                    enum:
                      - "success"
                      - "failure"
                      - "error"
                      - "aborted"
            - required:
                - completionTime
  additionalPrinterColumns:
    - name: Job
      type: string
      description: The name of the job being run.
      JSONPath: .spec.job
    - name: BuildId
      type: string
      description: The ID of the job being run.
      JSONPath: .status.build_id
    - name: Type
      type: string
      description: The type of job being run.
      JSONPath: .spec.type
    - name: Org
      type: string
      description: The org for which the job is running.
      JSONPath: .spec.refs.org
    - name: Repo
      type: string
      description: The repo for which the job is running.
      JSONPath: .spec.refs.repo
    - name: Pulls
      type: string
      description: The pulls for which the job is running.
      JSONPath: ".spec.refs.pulls[*].number"
    - name: StartTime
      type: date
      description: When the job started running.
      JSONPath: .status.startTime
    - name: CompletionTime
      type: date
      description: When the job finished running.
      JSONPath: .status.completionTime
    - name: State
      description: The state of the job.
      type: string
      JSONPath: .status.state
---
apiVersion: apps/v1
kind: Deployment
metadata:
  namespace: default
  name: hook
  labels:
    app: hook
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  selector:
    matchLabels:
      app: hook
  template:
    metadata:
      labels:
        app: hook
    spec:
      serviceAccountName: "hook"
      terminationGracePeriodSeconds: 180
      containers:
        - name: hook
          image: magicsong/hook:v20190711-664ef040d
          args:
            - --dry-run=false
            - --config-path=/etc/config/config.yaml
          ports:
            - name: http
              containerPort: 8888
          volumeMounts:
            - name: hmac
              mountPath: /etc/webhook
              readOnly: true
            - name: oauth
              mountPath: /etc/github
              readOnly: true
            - name: config
              mountPath: /etc/config
              readOnly: true
            - name: plugins
              mountPath: /etc/plugins
              readOnly: true
          # livenessProbe:
          #   httpGet:
          #     path: /healthz
          #     port: 8081
          #   initialDelaySeconds: 3
          #   periodSeconds: 3
          # readinessProbe:
          #   httpGet:
          #     path: /healthz/ready
          #     port: 8081
          #   initialDelaySeconds: 10
          #   periodSeconds: 3
          #   timeoutSeconds: 600
      volumes:
        - name: hmac
          secret:
            secretName: hmac-token
        - name: oauth
          secret:
            secretName: oauth-token
        - name: config
          configMap:
            name: config
        - name: plugins
          configMap:
            name: plugins
---
apiVersion: v1
kind: Service
metadata:
  namespace: default
  name: hook
spec:
  selector:
    app: hook
  ports:
    - port: 8888
  type: NodePort
---
apiVersion: apps/v1
kind: Deployment
metadata:
  namespace: default
  name: plank
  labels:
    app: plank
spec:
  selector:
    matchLabels:
      app: plank
  replicas: 1 # Do not scale up.
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: plank
    spec:
      serviceAccountName: "plank"
      containers:
        - name: plank
          image: magicsong/plank:v20190711-664ef040d
          args:
            - --dry-run=false
            - --config-path=/etc/config/config.yaml
          volumeMounts:
            - name: oauth
              mountPath: /etc/github
              readOnly: true
            - name: config
              mountPath: /etc/config
              readOnly: true
      volumes:
        - name: oauth
          secret:
            secretName: oauth-token
        - name: config
          configMap:
            name: config
---
apiVersion: apps/v1
kind: Deployment
metadata:
  namespace: default
  name: sinker
  labels:
    app: sinker
spec:
  selector:
    matchLabels:
      app: sinker
  replicas: 1
  template:
    metadata:
      labels:
        app: sinker
    spec:
      serviceAccountName: "sinker"
      containers:
        - name: sinker
          image: magicsong/sinker:v20190711-664ef040d
          args:
            - --config-path=/etc/config/config.yaml
          volumeMounts:
            - name: config
              mountPath: /etc/config
              readOnly: true
      volumes:
        - name: config
          configMap:
            name: config
---
apiVersion: apps/v1
kind: Deployment
metadata:
  namespace: default
  name: deck
  labels:
    app: deck
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  selector:
    matchLabels:
      app: deck
  template:
    metadata:
      labels:
        app: deck
    spec:
      serviceAccountName: "deck"
      terminationGracePeriodSeconds: 30
      containers:
        - name: deck
          image: magicsong/deck:v20190711-664ef040d
          args:
            - --config-path=/etc/config/config.yaml
            - --tide-url=http://tide/
            - --hook-url=http://hook:8888/plugin-help
          ports:
            - name: http
              containerPort: 8080
          volumeMounts:
            - name: config
              mountPath: /etc/config
              readOnly: true
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8081
            initialDelaySeconds: 3
            periodSeconds: 3
          readinessProbe:
            httpGet:
              path: /healthz/ready
              port: 8081
            initialDelaySeconds: 10
            periodSeconds: 3
            timeoutSeconds: 600
      volumes:
        - name: config
          configMap:
            name: config
---
apiVersion: v1
kind: Service
metadata:
  namespace: default
  name: deck
spec:
  selector:
    app: deck
  ports:
    - port: 80
      targetPort: 8080
  type: NodePort
---
apiVersion: apps/v1
kind: Deployment
metadata:
  namespace: default
  name: horologium
  labels:
    app: horologium
spec:
  replicas: 1 # Do not scale up.
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: horologium
  template:
    metadata:
      labels:
        app: horologium
    spec:
      serviceAccountName: "horologium"
      terminationGracePeriodSeconds: 30
      containers:
        - name: horologium
          image: magicsong/horologium:v20190711-664ef040d
          args:
            - --config-path=/etc/config/config.yaml
          volumeMounts:
            - name: config
              mountPath: /etc/config
              readOnly: true
      volumes:
        - name: config
          configMap:
            name: config
---
apiVersion: apps/v1
kind: Deployment
metadata:
  namespace: default
  name: tide
  labels:
    app: tide
spec:
  replicas: 1 # Do not scale up.
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: tide
  template:
    metadata:
      labels:
        app: tide
    spec:
      serviceAccountName: "tide"
      containers:
        - name: tide
          image: magicsong/tide:v20190711-664ef040d
          args:
            - --dry-run=false
            - --config-path=/etc/config/config.yaml
          ports:
            - name: http
              containerPort: 8888
          volumeMounts:
            - name: oauth
              mountPath: /etc/github
              readOnly: true
            - name: config
              mountPath: /etc/config
              readOnly: true
      volumes:
        - name: oauth
          secret:
            secretName: oauth-token
        - name: config
          configMap:
            name: config
---
apiVersion: v1
kind: Service
metadata:
  namespace: default
  name: tide
spec:
  selector:
    app: tide
  ports:
    - port: 80
      targetPort: 8888
  type: NodePort
---
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  namespace: default
  name: ing
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
spec:
  rules:
    - host: prow.your-domain.com # 这里换成你的域名
      http:
        paths:
          - path: / # Correct for GKE, need / on many other distros
            backend:
              serviceName: deck
              servicePort: 80
          - path: /hook
            backend:
              serviceName: hook
              servicePort: 8888
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: statusreconciler
  namespace: default
  labels:
    app: statusreconciler
spec:
  replicas: 1
  selector:
    matchLabels:
      app: statusreconciler
  template:
    metadata:
      labels:
        app: statusreconciler
    spec:
      serviceAccountName: statusreconciler
      terminationGracePeriodSeconds: 180
      containers:
        - name: statusreconciler
          image: magicsong/status-reconciler:v20190711-664ef040d
          args:
            - --dry-run=false
            - --continue-on-error=true
            - --plugin-config=/etc/plugins/plugins.yaml
            - --config-path=/etc/config/config.yaml
            - --github-token-path=/etc/github/oauth
          volumeMounts:
            - name: oauth
              mountPath: /etc/github
              readOnly: true
            - name: config
              mountPath: /etc/config
              readOnly: true
            - name: plugins
              mountPath: /etc/plugins
              readOnly: true
      volumes:
        - name: oauth
          secret:
            secretName: oauth-token
        - name: config
          configMap:
            name: config
        - name: plugins
          configMap:
            name: plugins
---
apiVersion: v1
kind: Namespace
metadata:
  name: test-pods
---
kind: ServiceAccount
apiVersion: v1
metadata:
  namespace: default
  name: "deck"
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: "deck"
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: "deck"
subjects:
  - kind: ServiceAccount
    name: "deck"
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: test-pods
  name: "deck"
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: "deck"
subjects:
  - kind: ServiceAccount
    name: "deck"
    namespace: default
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: "deck"
rules:
  - apiGroups:
      - "prow.k8s.io"
    resources:
      - prowjobs
    verbs:
      - get
      - list
      # Required when deck runs with `--rerun-creates-job=true`
      # **Warning:** Only use this for non-public deck instances, this allows
      # anyone with access to your Deck instance to create new Prowjobs
      # - create
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: test-pods
  name: "deck"
rules:
  - apiGroups:
      - ""
    resources:
      - pods/log
    verbs:
      - get
---
kind: ServiceAccount
apiVersion: v1
metadata:
  namespace: default
  name: "horologium"
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: "horologium"
rules:
  - apiGroups:
      - "prow.k8s.io"
    resources:
      - prowjobs
    verbs:
      - create
      - list
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: "horologium"
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: "horologium"
subjects:
  - kind: ServiceAccount
    name: "horologium"
---
kind: ServiceAccount
apiVersion: v1
metadata:
  namespace: default
  name: "plank"
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: "plank"
rules:
  - apiGroups:
      - "prow.k8s.io"
    resources:
      - prowjobs
    verbs:
      - get
      - create
      - list
      - update
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: test-pods
  name: "plank"
rules:
  - apiGroups:
      - ""
    resources:
      - pods
    verbs:
      - create
      - delete
      - list
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: "plank"
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: "plank"
subjects:
  - kind: ServiceAccount
    name: "plank"
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: test-pods
  name: "plank"
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: "plank"
subjects:
  - kind: ServiceAccount
    name: "plank"
    namespace: default
---
kind: ServiceAccount
apiVersion: v1
metadata:
  namespace: default
  name: "sinker"
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: "sinker"
rules:
  - apiGroups:
      - "prow.k8s.io"
    resources:
      - prowjobs
    verbs:
      - delete
      - list
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: test-pods
  name: "sinker"
rules:
  - apiGroups:
      - ""
    resources:
      - pods
    verbs:
      - delete
      - list
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: "sinker"
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: "sinker"
subjects:
  - kind: ServiceAccount
    name: "sinker"
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: test-pods
  name: "sinker"
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: "sinker"
subjects:
  - kind: ServiceAccount
    name: "sinker"
    namespace: default
---
apiVersion: v1
kind: ServiceAccount
metadata:
  namespace: default
  name: "hook"
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: "hook"
rules:
  - apiGroups:
      - "prow.k8s.io"
    resources:
      - prowjobs
    verbs:
      - create
      - get
  - apiGroups:
      - ""
    resources:
      - configmaps
    verbs:
      - create
      - get
      - update
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: "hook"
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: "hook"
subjects:
  - kind: ServiceAccount
    name: "hook"
---
apiVersion: v1
kind: ServiceAccount
metadata:
  namespace: default
  name: "tide"
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: "tide"
rules:
  - apiGroups:
      - "prow.k8s.io"
    resources:
      - prowjobs
    verbs:
      - create
      - list
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: "tide"
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: "tide"
subjects:
  - kind: ServiceAccount
    name: "tide"
---
apiVersion: v1
kind: ServiceAccount
metadata:
  namespace: default
  name: "statusreconciler"
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: "statusreconciler"
rules:
  - apiGroups:
      - "prow.k8s.io"
    resources:
      - prowjobs
    verbs:
      - create
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: "statusreconciler"
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: "statusreconciler"
subjects:
  - kind: ServiceAccount
    name: "statusreconciler"
```

apply 上述 manifest。过程可能持续几分钟。上面用到的镜像都来自 DockerHub，国内可以直接访问。出现问题尝试打印 Pod 日志或者 describe，用好 Google 和 GitHub 能解决几乎 99% 的技术问题。

```bash
curl -L https://git.io/JIJ4c -o prow.yaml
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
命令行翻译项目](https://github.com/Lonor/Tranclite/pull/5)。

### 使用 Prow

在 GitHub 的 Issue 或 Pull Request 页面下你可以用一个简单的 `/meow` 命令让机器人随机发送一张 🐱 的图片。无需任何刷新，GitHub 页面会自动地更新此页面（后来发现是基于 WebSocket）：

![cat-in-issue](/images/prow/1.png)

我们注意到， Kubernetes 维护人员会使用 `/test` 命令来让集群内的 Pod 执行测试并将结果告诉 GitHub，这就是 ProwJob 实现的了。

ProwJob 主要用于 PR 流程的 CI 测试，而国内网络原因无法使用 Google 的 GCS 服务，ProwJob 中 plank
依赖的 [Pod Utilities](https://github.com/kubernetes/test-infra/blob/master/prow/jobs.md#pod-utilities)，其中定义 GCS Bucket
用于存放构建产物、日志等内容，因此，我们似乎只能自己用自定义的镜像来跑临时 CI 任务了。注意定义 presubmit 字段下的 decorate 为
false，并利用好 [Prow 提供的一些环境变量](https://github.com/kubernetes/test-infra/blob/master/prow/jobs.md#job-environment-variables)。

下面是我的一个简单的 Spring Boot 项目利用 [Maven 镜像（配合阿里云的 Maven Repo）](https://hub.docker.com/r/lawrence2018/aliyun-maven)来做的
presubmits，同样在 config.yaml 中添加：

```yaml
presubmits:
  Lonor/kubernetes-springboot-demo:
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
来触发测试。[参考此 PR](https://github.com/Lonor/kubernetes-springboot-demo/pull/4)。

`/test` 后面加 presubmits 的 name 名可触发指定的测试 Pod，all 则测试全部。测试若失败，可使用 `/retest` 来重新测试。

![Prow-in-Pull-Request-Test.png](/images/prow/2.png)

如果测试通过，可使用 `/lgtm` 触发 tide 让机器人合并代码（注意自己不能 `/lgtm`）。

### 自研 Issue/PR Bot

GitHub 大规模使用 WebSocket 来动态修改 Issue 或 PR 页面的 DOM，在视觉上非常令人享受。笔者后来也参考 Prow 用 Go
写了一个简单了 [OpsBot](https://github.com/Lonor/OpsBot) 帮助自己的仓库做一些简单的 PR、Issue 的管理，现已开源，欢迎任何 Issue / PR！
