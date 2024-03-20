---
title: "Kubernetes Notes"
date: "2019-10-01"
themeColor: "#306de6"
description: "学习 K8s 时的一些琐碎笔记。"
image: prow/k8s.jpg
tags: note, kubernetes, k8s
---

Kubernetes [中文概述](https://kubernetes.io/zh-cn/docs/concepts/overview/)（是什么以及不是什么）。

实践时建议使用 [kubectl 自动补全](https://kubernetes.io/docs/reference/kubectl/quick-reference/)，极大提升交互效率。

### Pod

Pod 是比容器更高一层次的抽象，同一 Pod 中的所有容器共享

- 同一网络 namespace
- 存储

### Controller

- Deployment
- ReplicaSet
- DaemonSet
- StatefulSet
- Job

### Service

是一个[四层负载均衡器](https://lawrenceli.me/blog/load-balancing)，为 Pod 提供负载均衡。

### MiniKube

国内建议自定义镜像仓库，默认是 [gcr.io](http://gcr.io) ，似乎自带了 PV。

```bash
minikube start --vm-driver=none --image-repository=registry.cn-hangzhou.aliyuncs.com/google_containers --cpus 4 --memory 6144
```

感觉 Docker Desktop 内置的 Kubernetes 有点类似这个 minikube （master 可以直接运行 Pod，也就是单节点集群）。当然了，它们都只能用于开发/测试环境。

### Demo

[用 Spring Boot 创建了一个 HTTP 服务端](https://github.com/la3rence/kubernetes-springboot-demo)，可以尝试用 Kubernetes 部署它。

### 公网服务器集群初始化常用脚本

```sh
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
```

```sh
yum install -y kubeadm-1.19.13-0 kubelet-1.19.13-0 kubectl-1.19.13-0
```

```sh
kubeadm config images pull --image-repository registry.aliyuncs.com/google_containers --kubernetes-version v1.19.3
```

```sh
kubeadm init --image-repository registry.aliyuncs.com/google_containers --kubernetes-version v1.19.13 --apiserver-advertise-address $(hostname -i) --pod-network-cidr=10.96.0.0/16 --service-cidr=10.97.0.0/16
```

```sh
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config
```

Flannel:

```bash
wget https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml](https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml)
```

```bash
kubectl apply -f kube-flannel.yaml
```

运行 Master 作为 Node:

```bash
kubectl taint node $HOSTNAME node-role.kubernetes.io/master-
```

恢复 Master 不可调度：

```bash
kubectl taint node $HOSTNAME node-role.kubernetes.io/master="":NoSchedule
```

重置：

```bash
kubeadm reset
systemctl stop kubelet
rm -rf /var/lib/cni/
rm -rf /var/lib/etcd/
rm -rf /var/lib/kubelet/
rm -rf /etc/cni/
rm -rf $HOME/.kube
ifconfig cni0 down
ifconfig flannel.1 down
ifconfig docker0 down
ip link delete cni0
ip link delete flannel.1
systemctl restart kubelet
systemctl stop docker
systemctl restart docker
```

Pod 无法访问外网，尝试：

```bash
iptables -P FORWARD ACCEPT
iptables --flush
iptables -tnat --flush

iptables -F && iptables -t nat -F && iptables -t mangle -F && iptables -X
// POD 无法访问外网络，但是可以互相 ping 或 ping 宿主。CIDR 为 POD CIDR
// 有可能是 SNAT 时出了问题，使用动态 SNAT （即 MASQUERADE） 来配置 nat 表路由规则：
iptables -t nat -I POSTROUTING -s 10.96.0.0/16 -j MASQUERADE
// 再尝试重新运行 core dns 服务
```

[https://github.com/rancher/rancher/issues/6139](https://github.com/rancher/rancher/issues/6139)

[https://github.com/coredns/coredns/issues/2693](https://github.com/coredns/coredns/issues/2693)

网络调试：使用 BusyBox:1.28.3，不建议使用 latest 镜像.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: busybox
  namespace: default
  labels:
    app: busybox
spec:
  selector:
    matchLabels:
      app: busybox
  replicas: 1
  template:
    metadata:
      labels:
        app: busybox
    spec:
      containers:
        - name: busybox
          image: busybox:1.28.3
          command:
            - sleep
            - "3600"
          imagePullPolicy: IfNotPresent
      restartPolicy: Always
```

基于 DNS 的服务发现： Kubernetes Service / Pod 对象资源可以使用集群内部 FQDN 来访问，而不需要在意其扁平空间中的 Cluster IP。
Core DNS 会将 FQDN 动态地指向最新的 Cluster IP。参考 [Pod 与 Service 的 DNS](https://kubernetes.io/zh/docs/concepts/services-networking/dns-pod-service):

```bash
kubectl exec busybox -it -- nslookup kubernetes
```

返回内容：

```bash
Server:    10.97.0.10
Address 1: 10.97.0.10 kube-dns.kube-system.svc.cluster.local

Name:      kubernetes
Address 1: 10.97.0.1 kubernetes.default.svc.cluster.local
```
