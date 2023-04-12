---
title: "四层负载均衡和七层负载均衡"
date: "2018-10-09"
description: "在于 OSI 的层级"
tags: network, http, dns
---

对于初次了解负载均衡的人来说，可能会被理解成「四次负载均衡」、「七次负载均衡」，这就完全错了。这里要理解的话直接参考英文：layer 4 load-balancing & layer 7 load-balancing. 其实应当理解为工作在 OSI 第四层、第七层的负载均衡。

所以，所谓的层指的是 [OSI 网络模型](https://zh.wikipedia.org/wiki/OSI%E6%A8%A1%E5%9E%8B)中的层次，分别对应于传输层（比如 TCP）和应用层（具体的 Application）。
| Layer | Name | OSI protocols | TCP/IP protocols |
|:---:|:------------:|:---------------------------------------------------------------------------------:|:--------------------------------------------------------------------------------------------------------:|
| 7 | Application | FTAM X.400 X.500 DAP ROSE RTSE ACSE CMIP | HTTP HTTPS FTP SMTP |
| 6 | Presentation | ISO/IEC 8823X.226 ISO/IEC 9576-1 X.236 | MIME SSL/TLS XDR |
| 5 | Session | ISO/IEC 8327 X.225ISO/IEC 9548-1 X.235 | Sockets (session establishment in TCP / RTP / PPTP) |
| 4 | Transport | ISO/IEC 8073 TP0 TP1 TP2 TP3 TP4 (X.224)ISO/IEC 8602X.234 | TCP UDP SCTP DCCP |
| 3 | Network | ISO/IEC 8208 X.25(PLP) ISO/IEC 8878 X.223 ISO/IEC 8473-1CLNP X.233 ISO/IEC 10589 IS-IS | IP IPsec ICMP IGMP OSPF RIP |
| 2 | Data link | ISO/IEC 7666 X.25(LAPB) Token Bus X.222 ISO/IEC 8802-2 LLC| PPP SBTV SLIP |
| 1 | Physical | X.25 (X.21bis EIA/TIA-232 EIA/TIA-449 EIA-530G.703) | TCP/IP stack does not care about the physical medium, as long as it provides a way to communicate octets |

因此，基于 OSI 模型，先讲一个三层负载均衡 （即 IP 网络层）的例子 —— DNS 解析，同一个域名可以解析到多个 IP 上，但轮询策略大多数情况下不在自己手上。笔者加入的一家跨国公司内就提供了工作在此层的 Load Balancer，它会根据开发提供的应用健康情况实时动态更新内部网络的 DNS 解析记录，毋庸置疑，公司内部有非常复杂的网络拓扑，包括这样一个工作在局域网中的 DNS 服务器；四层负载均衡其实是在三层基础上加上了端口，也就是通过 IP + Port 的形式进行转发，而七层负载均衡在四层的基础上考虑应用的 URL 或应用层协议的其他字段（比如 HTTP Header）等方式做转发。

由于三、四层负载均衡直接偏底层一些，其代理的效率会比七层的更高，比如单从 TCP 的开销上来看：四层负载均衡时，服务端收到来自客户端的请求，根据负载均衡器的策略，对目标 IP/Port 做修改，转发到对应的后端服务，TCP 三次握手直接一次建立。而七层负载均衡工作在应用层，客户端必须首先与负载均衡器进行一次 TCP 握手，然后负载均衡器再与目标后端服务建立第二次 TCP 握手。相比之下，七层负载均衡的性能就弱了。

一个常见的现象：效率和安全（功能）往往不可兼得。七层负载均衡效率不高，其优势却在于可以植入一些应用上的逻辑，做流量压缩、鉴权、服务迁移、降级、熔断等处理，其可塑性会更好一点，且相对四层可以做一些安全上的设计，因为四层的负载均衡相当于直接间接地暴露了后端服务却难有应用层的调度。四层负载均衡器可以通过硬件实现，比如 F5，常见的软件实现是 lvs、nginx 中的 stream block，[Kubernetes 中的 Service 对象](https://kubernetes.io/zh/docs/concepts/services-networking/service/)。七层负载均衡器一般是一些高性能网关，比如 [OpenResty](https://openresty.org/cn/)，[Kubernetes 中的 Ingress 对象](https://kubernetes.io/zh/docs/concepts/services-networking/ingress/)。

最后我有个小问题，倘若我们使用 DoH (DNS over HTTPS) 技术进行某个 FQDN 的解析，比如 CloudFlare 的 DNS HTTPS API：

```bash
curl -H "accept: application/dns-json" "https://1.1.1.1/dns-query?name=lawrenceli.me"
```

假设此 HTTPS API 的结果会以 Round Robin 的形式返回多个不同的 IP 地址，那么仅基于此 DoH 做 DNS 解析的 Load Balancer 工作在第几层呢？
我的答案仍然是第三层——事实上 DNS 工作在第七层，但是负载均衡器发挥的作用仍然是改变了处在第三层的 IP 地址。

参考链接：

- [四层、七层负载均衡的区别 - Jamin Zhang](https://jaminzhang.github.io/lb/L4-L7-Load-Balancer-Difference/)
