---
title: "WebSocket 集群方案"
date: "2020-12-22"
description: "WebSocket 在 Spring Cloud 中如何实践分布式集群：一致性哈希的实现和 Fanout 广播"
tags: WebSocket, Software, Programming, SpringCloud, Java, Distributed
---

基于 Spring Cloud 使用一致性哈希算法实现分布式 WebSocket. / 基于 RabbitMQ 广播实现分布式 WebSocket.

### WebSocket 协议

参考 [RFC](https://tools.ietf.org/html/rfc6455) 标准规范。

### 思路

核心问题在于具备 WebSocket 服务端的 SpringBoot 或 SpringCloud 等微服务应用是**有状态**的。服务端的内存中存在维持连接的
Session。客户端连接服务器时，只能和集群中的唯一一个服务实例来连接，而且数据传输过程中也直接和此实例通信。

解决方案有很多。

#### 方案一：将状态放到应用之外的存储中，但不可行

这个方案非常类似于 HTTP 协议的 Token 实现（非 JWT），Java 中具体的例子就是 Spring Session 以及 Spring Security 的 Token Store，比如 RedisTokenStore 实现了将
OAuth2 Token 存放到 Redis 的逻辑。此方案的核心前提是可序列化。WebSocket 协议和 HTTP 协议并不同，一个 WebSocket Session 对应于一次 TCP Socket
连接而非数据，新的连接将会基于新的四元组，不可能做到序列化。

#### 方案二：一致性哈希

像微服务注册中心一样，维护一个全局映射关系 —— 当前客户端的 WebSocket
连接是和哪一个实例/节点保持的。每次通信都经过此注册中心或哈希，查询到具体的服务实例，将连接交给它。同样会遇到一些问题，比如：哈希环的实现、如何解决一致性问题（单节点故障的 Session 迁移重连将代价降到最低）、CAP
取舍、实例的区分依据是什么（IP ? 实例
ID？）、可能与注册中心构成强依赖、以及部署环境的变更带来运维上的挑战等难题。这个方案实施有一定的成本和技术限制，可以参考[这篇文章](https://segmentfault.com/a/1190000017307713)的大体思路，理解了核心的哈希环的概念(如下图)，再配合注册中心、服务上下线消息，就能完成基本的实现。我利用
Nacos、Redis、RabbitMQ 基于 Spring Cloud 写了一个通过一致性哈希来实现的全栈项目，前端和后端都已开源 ——
[WebSocket 集群的一致性哈希实践(Spring Cloud 后端) - GitHub](https://github.com/Lonor/websocket-cluster)
, [WebSocket 客户端模拟与服务列表(React 前端) - GitHub](https://github.com/Lonor/websocket-cluster-front),
最近刚刚写好基本的功能，参考 [@ufiredong](https://github.com/ufiredong)
的方式利用 [Java 语言的 Docker SDK](https://github.com/docker-java/docker-java) 实现模拟 WebSocket 实例的上下线。未来还会稍微做细微的优化。

<div>
    <github user="Lonor" repo="websocket-cluster"></github>
</div>

![HashRing:虚拟节点上线后部分客户端需要迁移节点](/images/websocket-cluster/hashring.png)

另外，Nacos 作为微服务的注册中心是国内比较流行的选择。但有人早就向 Nacos 社区提出了[维护哈希环的议题](https://github.com/alibaba/nacos/issues/2114)；姑且不说此议题是否合理，但
Nacos 的维护人员竟然没有能够理解这样的需求，还是有点令人诧异。

最终效果如下, 上线一个新的服务实例后，客户端会自动根据最新哈希环重新路由到最新节点上，收发消息一切正常：

<div class="embed">
  <iframe src="//www.bilibili.com/blackboard/html5mobileplayer.html?bvid=BV1sg411q78V&danmaku=0&high_quality=1"
  ></iframe>
</div>

#### 方案三：广播队列

每次连接都需要通知到所有实例，实例各自都判断连接状态在不在自己这里，不在的话直接忽略，在就处理。类似于发布订阅模型，可以通过 MQ（RabbitMQ、Kafka、RocketMQ 等）或 Redis
做到。此方案实现简单，适用于集群规模不大的场景，因为需要所有的节点进行判断或计算。我愿称之为：分布式事件驱动。

以下基于 RabbitMQ 做了简单实现。

##### 简单广播实现 WebSocket 集群

[声明式 API](/blog/declarative-programming) 的好处就体现在这里：短短几行就直接利用了 RabbitMQ 的 Java SDK 创建好交换机和队列以及绑定关系。

```java
package me.lawrenceli.websocket.server.configuration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.AnonymousQueue;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class MqConfig {

    private static final String FANOUT_EXCHANGE = "websocket-exchange";

    @Bean
    public FanoutExchange fanoutExchange() {
        log.info("创建广播交换机 [{}]", FANOUT_EXCHANGE);
        return new FanoutExchange(FANOUT_EXCHANGE);
    }

    @Bean
    public AnonymousQueue queueForWebSocket() {
        log.info("创建用于 WebSocket 的匿名队列");
        return new AnonymousQueue();
    }

    /**
     * @param fanoutExchange    交换机
     * @param queueForWebSocket 队列
     * @return Binding
     */
    @Bean
    public Binding bindingSingle(FanoutExchange fanoutExchange, AnonymousQueue queueForWebSocket) {
        log.info("把匿名队列 [{}] 绑定到广播交换器 [{}]", queueForWebSocket.getName(), fanoutExchange.getName());
        return BindingBuilder.bind(queueForWebSocket).to(fanoutExchange);
    }

}
```

然后是生产者和消费者。生产者将消息发送到队列中进行广播，集群的消费者监听队列，判断此 WebSocket Session 是否在当前消费节点再做进一步处理。

消息生产方，一般是外层接收到消息通信请求，然后调用进行集群内广播：

```java
package me.lawrenceli.websocket.server.configuration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class FanoutSender {

    @Autowired
    private FanoutExchange fanoutExchange;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void send(Object message) {
        log.info("开始发送广播: [{}]", message.toString());
        rabbitTemplate.convertAndSend(fanoutExchange.getName(), "", message);
    }

}
```

消息消费方，多节点共同消费同一消息，区分是否需要自己来处理：

```java
package me.lawrenceli.websocket.server.configuration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class FanoutReceiver {

    @RabbitListener(queues = "#{queueForWebSocket.name}")
    public void singleReceiver(Object message) {
        log.info("队列接收到了消息: [{}]", message.toString());
        // 判断 WebSocket Session 是否在当前节点
        // 一般维护在一个 ConcurrentHashMap 静态变量中，这里叫 sessionMap
        // message 中有类似 SessionId 的字段
        if (sessionMap.contains(sessionId)) {
            log.info("WebSocket Session 在当前节点");
            // 执行相应的流程
        } else {
            log.info("当前节点无此 WebSocket Session");
            // 什么都不用做，直接忽略
        }
    }

}
```

注意，方案 2、方案 3 都没有解决单节点故障问题，因为从本质上讲，没有实现 WebSocket Session
的全局共享。但是方案二能够依赖哈希环的更新，最大程度上地降低迁移连接的代价，客户端会有重试的机制来针对单节点故障问题做容错。如果规模较大，项目复杂，且客户端连接数多，推荐使用一致性哈希的方案二，当然下面也有其他的社区方案。

### 其他案例

即刻 App 后端基于 Node.js 使用了 [socket.io](http://socket.io) 实现多端实时通信，Joway
的[这篇文章](https://blog.joway.io/posts/socket-io/)交代的一些细节也涉及了分布式部署的问题。

socket.io 官网也提供了[多节点的使用方法](https://socket.io/docs/v3/using-multiple-nodes/index.html)，不外乎 IP Hash 之类的方案。

### Kubernetes 内的 Websocket 集群

如果部署环境基于 Kubernetes 内的 WebSocket
集群，也可以参考[阳明的这篇文章](https://www.qikqiak.com/post/socketio-multiple-nodes-in-kubernetes/)来实践 （利用 Service
的 `sessionAffinity` 会话亲和确保每次将来自特定客户端的连接传递到同一 Pod：使用 `ClientIP` 声明）。
