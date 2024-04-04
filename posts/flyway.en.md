---
title: "Dependency Injection with Flyway"
date: "2024-04-04"
description: "Increase reliability of deployments by versioning your database"
tags: flyway, java, database, migration, springboot, programming
visible: true
---

## What is Flyway

[Flyway](https://flywaydb.org/) is an open-source database version control tool implemented in Java. It offers various methods such as CLI, Java API, Maven/Gradle Plugin, etc., making it convenient for developers to manage and deploy changes to database table structures and contents in traceable code form. Flyway supports most mainstream relational databases, including MySQL, SQL Server, Oracle Database, PostgreSQL, SQLite, TiDB, MariaDB, etc. Support for MongoDB is still in the preview stage (Mongock is recommended instead). Its counterpart, Liquibase, is more complex to use compared to Flyway, with additional concepts serving as a learning curve.

<div>
  <github user="flyway" repo="flyway"></github>
</div>

## Integration with Spring Boot

Following Spring Boot's well-known convention-over-configuration principle, the Spring team provides [Flyway Auto Configuration](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/flyway).

```java
@AutoConfiguration(after = { DataSourceAutoConfiguration.class, JdbcTemplateAutoConfiguration.class,HibernateJpaAutoConfiguration.class })
@ConditionalOnClass(Flyway.class)
@Conditional(FlywayDataSourceCondition.class)
@ConditionalOnProperty(prefix = "spring.flyway", name = "enabled", matchIfMissing = true)
@Import(DatabaseInitializationDependencyConfigurer.class)
@ImportRuntimeHints(FlywayAutoConfigurationRuntimeHints.class)
public class FlywayAutoConfiguration { /*...*/ }
```

The fully qualified class name `org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration` will perform automatic configuration when the following conditions are detected:

1. The `Flyway` class exists (class name: `org.flywaydb.core.Flyway`)
2. Bean or properties conditions are met in the `FlywayDataSourceCondition` class, meaning connection configurations such as `DataSource` and database URL exist.
3. The property configuration `spring.flyway.enabled=true` exists.

For MySQL, besides the required JDBC dependency, you need to include Flyway's own dependencies. Spring Boot has already declared the version number in the POM, so no additional version field is needed here:

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

There are two ways to use it:

1. Native SQL
2. Java API

Flyway will discover version change files or implementation classes based on the default configured folder path `classpath:db/migration`.

```txt
V{VERSION}__{DESCRIPTION}.sql
V{VERSION}__{DESCRIPTION}.java
```

`VERSION` can be a string version containing dots and underscores, and `DESCRIPTION` is a simple description text. The separator in the middle is two underscores. Custom prefixes and suffixes can be configured through spring.flyway.

The `V{VERSION}__{DESCRIPTION}.sql` file needs to be placed in the `src/main/resources/db/migration` folder, while Java classes need to define the package name as db.migration and inherit the superclass `BaseJavaMigration`. We need to do is overriding the following method:

```java
void migrate(Context context) throws Exception;
```

According to the official documentation, we can implement database content version changes using Java code in the `migrate()` method. However, the drawback here is that we cannot perform dependency injection for `V{VERSION}__{DESCRIPTION}.java` in the Spring environment. We can only attempt to use plain SQL implementations through native JDBC methods, static methods, etc., rather than fully utilizing existing DAO interfaces for business data updates. Therefore, custom configuration of Flyway is required.

## Performing Dependency Injection into Flyway Class

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
    // Custom migration history table name
    private static final String SCHEMA_HISTORY_TABLE = "schema_changes";

    @Autowired
    private DataSource dataSource;

    @Autowired
    private ApplicationContext applicationContext;

    @PostConstruct
    public void migrate() {
        log.info("Flyway, starting!");
        // Retrieving all migration implementation classes through the Spring container
        // All implementation classes no longer need to be defined in the `db.migration` package,
        // they can be placed in any location that supports Bean scanning
        JavaMigration[] migrationBeans = applicationContext
                .getBeansOfType(JavaMigration.class)
                .values()
                .toArray(new JavaMigration[0]);
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource) // No need to configure flyway JDBC URL by using the original DataSource
                .locations("db/migration") // Default migration script path
                .table(SCHEMA_HISTORY_TABLE) // Default migration history table is `flyway_schema_history`
                .baselineOnMigrate(true) // Default false, must be set to true for initial migration on existing databases
                .baselineVersion("0") // Default "1"
                .executeInTransaction(true) // Performing migration as a transaction
                .installedBy(applicationContext.getId()) // Using microservice name as migration executor
                .javaMigrations(migrationBeans) // Registering migration classes
                .load();
        MigrateResult migrate = flyway.migrate(); // Executing migration by calling subclass implementations sequentially
        log.info("Flyway migrated {} versions. {}", migrate.migrationsExecuted, migrate.success);
    }
}

```

Since Flyway's configuration is based on manual configuration like this, it's necessary to exclude the original auto-configuration classes in the Spring Boot startup class to avoid conflicts in auto-configuration loading.

```java
@SpringBootApplication(exclude = FlywayAutoConfiguration.class)
public class MyApplication {

    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }

}
```

Finally, define a Component Bean to implement `BaseJavaMigration`:

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

Now, all migration classes can easily use dependency injection to perform CRUD operations. In practice, Flyway will execute all migrations synchronously after database connection configuration and before HTTP service exposure, ensuring that timing does not affect online services.

## Reference

- <https://github.com/flyway/flyway/issues/1062>
