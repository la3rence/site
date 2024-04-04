---
title: "在 Flyway 迁移类中实现依赖注入"
date: "2024-04-04"
description: "数据库版本迁移工具"
tags: flyway, java, database, migration, springboot, programming
visible: true
---

## Flyway 是什么

[Flyway](https://flywaydb.org/) 是一款开源的，基于 Java 实现的数据库内容变更控制工具。它提供了 CLI、Java API、Maven/Gradle Plugin 等多种方式方便开发人员将数据库的表结构改动、内容变动以可追溯的代码形式进行管理和部署。Flyway 支持包括大多数主流的关系型数据库：MySQL、SQL Server、Oracle Database、PostgreSQL、SQLite、TiDB、MariaDB 等，对于 MongoDB 的支持尚在预览阶段（更推荐 Mongock），同类竞品有 Liquibase，但 Liquibase 的使用相比 Flyway 更复杂，有额外的概念作为学习成本。

<div>
  <github user="flyway" repo="flyway"></github>
</div>

## 配合 Spring Boot 使用

遵循 SpringBoot 广为人知的约定大于配置，Spring 官方提供了 [Flyway 的自动配置实现](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/flyway)。

```java
@AutoConfiguration(after = { DataSourceAutoConfiguration.class, JdbcTemplateAutoConfiguration.class,HibernateJpaAutoConfiguration.class })
@ConditionalOnClass(Flyway.class)
@Conditional(FlywayDataSourceCondition.class)
@ConditionalOnProperty(prefix = "spring.flyway", name = "enabled", matchIfMissing = true)
@Import(DatabaseInitializationDependencyConfigurer.class)
@ImportRuntimeHints(FlywayAutoConfigurationRuntimeHints.class)
public class FlywayAutoConfiguration { /*...*/ }
```

全限定类名 `org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration` 会在检测到以下几种状态下实现自动配置：

1. 存在 `Flyway` 类 (即 `org.flywaydb.core.Flyway`)
2. 满足 `FlywayDataSourceCondition` 类中的 Bean 或 Properties 条件，其实就是 `DataSource` 和数据库 URL 等连接配置存在
3. 存在 `spring.flyway.enabled=true` 属性配置

对于 MySQL 而言，除了必须的 JDBC 依赖之外，需要引入 Flyway 自身依赖，SpringBoot 已经在 pom 中声明过版本号，因此此处无需额外定义版本字段:

```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-mysql</artifactId>
</dependency>
```

具体使用有两种方式：

1. 原生 SQL
2. Java API

Flyway 会基于默认配置的文件夹路径 classpath:db/migration 发现版本变更文件或实现类。

```txt
V{VERSION}__{DESCRIPTION}.sql
V{VERSION}__{DESCRIPTION}.java
```

`VERSION` 可使用包含小数点、下划线的字符串版本，`DESCRIPTION` 则是简单的描述文本。中间的分割符是两个下划线。可通过 spring.flyway 配置自定义前后缀。

`V{VERSION}__{DESCRIPTION}.sql` 文件需要存放在 src/main/resources/db/migration 文件夹下; Java 类则需要定义包名 `db.migration` 并且继承父类 `BaseJavaMigration`，重写如下方法:

```java
void migrate(Context context) throws Exception;
```

按照官方的写法，我们就可以在 `migrate()` 方法中去用 Java 代码实现数据库内容版本变动了，但是这里有一个缺点，那就是我们在 Spring 环境下无法针对 `V{VERSION}__{DESCRIPTION}.java` 进行依赖注入，只能尝试通过原生 JDBC 的方式、静态方法等去写比较朴素的 SQL 实现，而不能充分成分利用现有的 DAO 接口来做业务数据的更新。因此需要自定义配置 Flyway。

## 向 Flyway Migration 实现类进行依赖注入

```java
package me.lawrenceli.migration.config;

import jakarta.annotation.PostConstruct;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.migration.JavaMigration;
import org.flywaydb.core.api.output.MigrateResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class FlywayConfig {
    // 自定义迁移历史表名
    private static final String SCHEMA_HISTORY_TABLE = "schema_changes";

    @Autowired
    private DataSource dataSource;

    @Autowired
    private ApplicationContext applicationContext;

    @PostConstruct
    public void migrate() {
        log.info("Flyway, 启动!");
        // 通过 Spring 容器获取所有迁移实现类
        // 这样一来，所有实现类就不再需要定义在 package `db.migration` 下，可以放在任何支持 Bean 扫描的位置。
        JavaMigration[] migrationBeans = applicationContext
                .getBeansOfType(JavaMigration.class)
                .values()
                .toArray(new JavaMigration[0]);
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource) // 通过原本的 DataSource Bean 实现无需配置 flyway 自身的 JDBC URL
                .locations("db/migration") // 默认迁移脚本路径
                .table(SCHEMA_HISTORY_TABLE) // 默认迁移历史表为 `flyway_schema_history`
                .baselineOnMigrate(true) // 默认 false, 对以存在的数据库做首次迁移必须设置开启
                .baselineVersion("0") // 默认 "1"
                .executeInTransaction(true) // 将迁移作为事务，你懂的
                .installedBy(applicationContext.getId()) // 将微服务名作为迁移执行者
                .javaMigrations(migrationBeans) // 注册迁移类
                .load();
        MigrateResult migrate = flyway.migrate(); // 执行迁移，依次调用子类实现
        log.info("Flyway 迁移了 {} 版. {}", migrate.migrationsExecuted, migrate.success);
    }
}
```

由于 Flyway 的配置基于这种手动配置，因此需要在 SpringBoot 启动类上排除原有的自动配置类，以防止自动配置存在加载冲突。

```java
@SpringBootApplication(exclude = FlywayAutoConfiguration.class)
public class MyApplication {

    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }

}
```

最后，定义一个 Component Bean 去实现 BaseJavaMigration:

```java
package me.lawrenceli.balabala.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class V2__QueryExample extends BaseJavaMigration {

    @Autowired
    private MyMapper myMapper; // Bean of DAO

    @Override
    public void migrate(Context context) throws Exception {
        Data data = myMapper.selectById(2024L);
        // ... other CRUD codes with Java
    }
}
```

这样，所有的迁移类都可以方便地使用依赖注入来愉快地做 CRUD 了。经过实践，Flyway 会在数据库连接配置后、HTTP 服务暴露(也就是 Servlet 容器监听端口)前同步地执行完所有迁移，因此无需担心执行时机影响线上服务。

## 参考

- <https://github.com/flyway/flyway/issues/1062>
