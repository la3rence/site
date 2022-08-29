---
title: "四层负载均衡和七层负载均衡"
date: "2018-10-09"
---

对于初次了解负载均衡的人来说，可能会被理解成「四次负载均衡」、「七次负载均衡」，这就完全错了。这里要理解的话直接参考英文：layer 4 load-balancing & layer 7 load-balancing. 其实应当理解为工作在 OSI 第四层、第七层的负载均衡。

所以，所谓的层指的是 [OSI 网络模型](https://zh.wikipedia.org/wiki/OSI%E6%A8%A1%E5%9E%8B)中的层次，分别对应于传输层（比如 TCP）和应用层（具体的 Application）。

因此，基于 OSI 模型，先讲一个三层负载均衡的例子，DNS 解析，同一个域名可以解析到多个 IP 上，但轮询策略不在自己手上；四层负载均衡其实是在三层基础上加上了端口，也就是通过 IP + Port 的形式进行转发，而七层负载均衡在四层的基础上考虑应用的 URL 等方式做转发。

由于三、四层负载均衡直接偏底层一些，其代理的效率会比七层的更高，比如单从 TCP 的开销上来看：四层负载均衡时，服务端收到来自客户端的请求，根据负载均衡器的策略，对目标 IP/Port 做修改，转发到对应的后端服务，TCP 三次握手直接一次建立。而七层负载均衡工作在应用层，客户端必须首先与负载均衡器进行一次 TCP 握手，然后负载均衡器再与目标后端服务建立第二次 TCP 握手。相比之下，七层负载均衡的性能就弱了。

一个常见的现象：效率和安全（功能）往往不可兼得。七层负载均衡效率不高，其优势却在于可以植入一些应用上的逻辑，做流量压缩、鉴权、服务迁移、降级、熔断等处理，其可塑性会更好一点，且相对四层可以做一些安全上的设计，因为四层的负载均衡相当于直接间接地暴露了后端服务却难有应用层的调度。四层负载均衡器可以通过硬件实现，比如 F5，常见的软件实现是 lvs、nginx 中的 stream block，[Kubernetes 中的 Service 对象](https://kubernetes.io/zh/docs/concepts/services-networking/service/)。七层负载均衡器一般是一些高性能网关，比如 [OpenResty](https://openresty.org/cn/)，[Kubernetes 中的 Ingress 对象](https://kubernetes.io/zh/docs/concepts/services-networking/ingress/)。

参考链接：

- [四层、七层负载均衡的区别 - Jamin Zhang](https://jaminzhang.github.io/lb/L4-L7-Load-Balancer-Difference/)
