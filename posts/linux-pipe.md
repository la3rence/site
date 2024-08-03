---
title: "Linux 下进程间通信的实例"
date: "2017-03-10"
description: "Linux process communication examples"
tags: linux, note
visible: false
---

> 本科期间学 C 和 Linux 时的一些笔记

## 一、进程介绍

### 1.1 Linux 进程概述

进程是一个程序一次执行的过程，是操作系统动态执行的基本单元。
进程的概念主要有两点：

- 进程是一个实体。
- 进程是一个「执行中的程序」，和「程序」有着本质的区别。

程序是静态的；而进程是动态的，是一个运行者的程序，包含了进程的动态创建、调度和消亡的过程，是 Linux 的基本调度单位。

#### 进程的内存布局

逻辑上将一个进程划分为以下部分

- 文本： 程序的指令
- 数据： 程序使用的静态变量
- 堆： 程序可以从该区域动态分配额外内存
- 栈： 随函数调用、返回而增减的一片内存，用于为局部变量和函数调用链接信息分配存储空间

### 1.2 进程标识

OS 会为每个进程分配一个**唯一的整形**ID，作为进程的标识号（pid）。进程除了自身 ID 之外，还有父进程 ID（ppid）。即 **每个进程都必须有它的父进程**，「祖先进程」是同一个进程—— init 进程，ID 为 1，是内核自举后的第一个启动的进程。

PID 唯一地标识一个进程。

通过两个函数获得：

```c
pid_t getpid(void); // pid (Child Process)
pid_t getppid(void); // ppid (Parent Process)
```

通过 `ps` 命令来查询正在运行的进程，如 `ps -eo pid`, `comm` 命令。

### 1.3 进程的状态

- 执行态： 该进程正在运行，即进程正在占用 CPU
- 就绪态： 进程已经具备执行的一切条件，正在等待分配 CPU 的处理时间片
- 等待态： 进程不能使用 CPU，若等待事件发生（等待的资源分派到）则可将其唤醒

### 1.4 Linux 下进程结构以及管理

![](https://i2.buimg.com/580272/5c5db3caa801a0b3.png)

### 1.5 杀死进程 kill 命令

杀死进程前需要获得进程的 PID 号，可以使用 ps 命令获取，PID 号是进程唯一标识符。

### 1.6 查看进程状态

`ps -aux` 查看各进程状态，包括运行就绪等待状态  
`ps -aux|grep 'pp'` 查找指定（pp）进程  
`ps -ef` 查看所有进程的 pid，ppid 等信息

## 二、进程创建与控制

### 2.1 fork 函数

fork 函数从已存在的进程中创建一个子进程，原进程为父进程。
fork 函数被调用一次后返回两次，三个不同的返回值：

1. 在父进程中，fork 返回新创建的子进程的 PID 号
2. 在子进程中，fork 返回 0
3. 若出现错误，fork 返回一个负值

因此, **可以通过返回值来判断父子进程**。

#### fork 函数创建子进程的过程

使用 fork 函数得到的子进程是父进程的一个复制品，它从父进程继承了进程的地址空间，包括进程上下文、进程堆栈、内存信息、打开的文件描述符、信号控制设定、进程优先级、进程组号、当前工作目录、根目录、资源限制、控制终端，而子进程所独有的只有其进程号、资源使用和计时器等。通过这种复制方式创建出子进程后，原有的进程和子进程都从函数 fork 返回，各自继续往下运行。即所谓，fork 函数不仅复制了进程的资源，更复制了原有进程的运行状态，所以复制出的子进程虽然什么都和父进程一样，但它从 fork 函数后面开始运行。但是原有的进程的 fork 返回值不同，在原进程中，fork 返回子进程的 pid，而在子进程中，fork 返回 0，若 fork 返回负值，表示创建子进程失败。

```c
#include <stdio.h>
#include <sys/types.h>
#include <unistd.h>
int main(void){
 pid_t pid;
 pid=fork();
 int i = 0;
 if(pid == 0){
 printf("child process pid = %d, parent process id = %d\n",getpid(),getppid());
  while(i<10)
  {
   printf("hello\n");
   i++;
   sleep(1);
  }
}
 else if(pid>0)
 {
 printf("parent process pid = %d, child pid= %d\n", getpid(), pid);
  while(i<10){
   printf("everyone\n");
   i++;
   sleep(1);
  }
}
 return 1;
}
```

运行结果：

```plaintext
parent process pid = 91650, child pid= 91651
everyone
child process pid = 91651, parent process id = 91650
hello
hello
everyone
hello
everyone
hello
everyone
hello
everyone
hello
everyone
hello
everyone
hello
everyone
hello
everyone
hello
everyone
```

### 2.2 wait 和 waitpid 函数

#### 孤儿进程

用 fork 函数启动一个子进程时，子进程有了它的生命并将独立运行。
如果父进程先于子进程退出，则子进程是孤儿进程，此时将自动被 PID 为 1 的进程（init）接管。孤儿进程退出后，它的清理工作有祖先进程 init 自动处理，但在 init 经常清理子进程之前，它一直消耗系统的资源，所以要尽量避免。

```c
//single process example
#include<stdio.h>
#include<stdlib.h>
#include<unistd.h>
int main(void)
{
 pid_t pid;
 int dat = 0;
 if (fork()>0)
  {
  printf("Parent PID: %d\n",getpid());
  sleep(2);
  printf("Parent Exit!\n");
  exit(0);
  }
 else
  {
  printf("Child PID: %d\n",getpid());
  while(1)
   {

   }
  }
return 0;
}
```

#### 僵尸进程

如果子进程先退出，系统不会自动清理掉子进程的环境，而必须由父进程调用 wait 或 waitpid 函数来完成清理工作，如果父进程不做清理工作，则已经退出的子进程将成为僵尸进程（defunct），在系统中若存在僵尸进程（zombie）过多，将会影响系统性能，因此必须对僵尸进程进行处理。

函数原型：

```c
#include<sys/types.h>
#include<sys/wait.h>
pid_t wait(int * status);
pid_t waitpid(pid_t, int * status, int options)
```

- wait 和 waitpid 都将暂停父进程，等待一个子进程退出，并进行清理工作
- wait 函数随机等待一个子进程退出，并返回该子进程的 pid
- waitpid 等待指定 pid 的子进程退出；如果为 -1 表示等待所有子进程，同样返回该子进程的 pid
- status 参数是传出参数，它将子进程的退出码保存到 status 指向的变量里
- options 用于改变 waitpid 的行为，其中最常用的是 WNOHANG，它表示无论子进程是否退出都将立即返回，不会将调用者的执行挂起

```c
//dead process example
#include<stdio.h>
#include<sys/types.h>
#include<unistd.h>
int main(void){
 pid_t pid;
 int i = 0;
 pid = fork();
 if(pid == 0)
 {
  while(i<100)
   {
   printf("i = %d\n",i++);
   }
  printf("child exit\n");
 }
 else if(pid>0)
   {
   wait();
   printf("parent exit\n");
   }
 return 1;
}
```

### 2.3 exec 函数族

#### exec 函数族组成

```c
extern char **environ;
int execl(const char * path, const char * arg, ...);
int execlp(const char * file, const char * arg, ...);
int execle(const char * path, const char * arg, ..., char * const envp[]);
int execv(const char * path, char * const argv[]);
int execvp(const char * path, char * const argv[]);
int execve(const char * path, char * const argv[], char * const envp[]);
```

exec 函数族的作用是运行第一个参数指定的可执行程序。但其工作过程与 fork 完全不同。fork 是在复制一个原进程，而 exec 函数执行第一个参数指定的课执行程序之后，这个新程序运行起来后也是一个进程，而这个进程会覆盖原有的进程空间，即原有进程的所有内容都被新运行的进程全部覆盖。所有 exec 函数后面的所有代码都不再执行，但它之前的是可以被执行的。

- path 是包括执行文件名的绝对路径，file 既可以是绝对路径也可以是执行文件名
- arg 是可执行文件的全部命令行参数，可以用多个，最后一个参数为 NULL
- argv 是一个字符串的数组 char \* argv[] = { "ful path", "param1", "param2", ..., NULL};
- envp 指定新进程的环境变量 char \* envp[] = {"name1 = val1", "name2 = val2", ..., NULL};

exec 函数组传递参数的两种方式，一种是逐个列举的方式，另一种是将所有参数整体构造指针数组传递。

#### execlp 函数使用实例

```c
#include <stdio.h>
#include <unistd.h>
int main(){
 execlp("ls", "ls", "-l", NULL);
 printf("Hello world!\n"); // 不会执行
 return 0;
}
```

#### execv 函数使用实例

```c
#include <stdio.h>
#include <unistd.h>
int main(){
 char * str[] = {"ls","-l", NULL};
 execv("/bin/ls", str);
 printf("Hello world!\n"); // 不会执行
 return 0;
}
```

#### execvp 函数使用实例

```c
#include <stdio.h>
#include <unistd.h>
int main(){
 char * str[] = {"ls","-l", NULL};
 execv("ls", str);
 printf("Hello world!\n"); // 不会执行
 return 0;
}
```

#### execle 函数使用实例

```c
#include <stdio.h>
#include <unistd.h>
int main(){
 char * arrEnv[] = {"PATH_1=/bin:/usr/bin", NULL}; // 传递新进程的环境变量
 execle("/bin/ls", "ls", "-l", NULL, arrEnv);
 printf("Hello world!\n"); // 不会执行
 return 0;
}
```

#### execve 函数使用实例

```c
#include <stdio.h>
#include <unistd.h>
int main()
{
 char * str[] = {"ls","-l", NULL};
 char * arrEnv[] = {"PATH_1=/bin:/usr/bin", NULL};//传递新进程的环境变量
 execve("/bin/ls", str, arrEnv);
 printf("Hello world!\n"); // 不会执行
 return 0;
}
```

## 三、线程接口

### 3.1 线程简介

线程是程序执行流的最小单元。一个标准的线程有线程 ID，当前指令指针 PC，寄存器集合和堆栈组成。线程是进程中的一个实体，是被系统独立调度和分派的基本单元，线程自己不拥有全部资源，只拥有一点儿在运行中必不可少的资源，但它可与同属一个进程的其它线程共享进程所拥有的全部资源。一个线程可以创建和撤消另一个线程，同一进程中的多个线程之间可以并发执行。由于线程之间的相互制约，致使线程在运行中呈现出间断性。线程也有就绪、阻塞和运行三种基本状态。就绪状态是指线程具备运行的所有条件，逻辑上可以运行，在等待处理机；运行状态是指线程占有处理机正在运行；阻塞状态是指线程在等待一个事件（如某个信号量），逻辑上不可执行。每一个程序都至少有一个线程，若程序只有一个线程，那就是程序本身。  
线程是程序中一个单一的顺序控制流程。进程内一个相对独立的、可调度的执行单元，是系统独立调度和分派 CPU 的基本单位指运行中的程序的调度单位。在单个程序中同时运行多个线程完成不同的工作，称为多线程。

### 3.2 线程接口函数

#### 3.2.1 创建线程

pthread_create 是 Linux 操作系统的创建线程的函数

- 编译是需要制定链接库 -lpthread
- 函数原型

```c
#include <stdio.h>
int pthread_create(
 pthread_t * thread,
 const pthread_attr_t * attr,
 (void *)(* start_rtn)(void *),
 void * arg
);
```

- 参数说明

第一个参数为指向线程标识符的指针。  
第二个参数用来设置线程属性。  
第三个参数是线程运行函数的起始地址。  
最后一个参数是运行函数的参数。

- 返回值

若线程创建成功，则返回 0。若线程创建失败，则返回出错编号，并且 \*thread 中的内容是未定义的。  
返回成功时，由 thread 指向的内存单元被设置为新创建线程的线程 ID。attr 参数用于指定各种不同的线程属性。新创建的线程从 start_rtn 函数的地址开始运行，该函数只有一个万能指针参数 arg，如果需要向 start_rtn 函数传递的参数不止一个，那么需要把这些参数放到一个结构中，然后把这个结构的地址作为 arg 的参数传入。

#### 3.2.3 退出线程

线程通过调用 pthread_exit 函数终止执行，就如同进程在结束时调用 exit 函数一样。这个函数的作用是，终止调用它的线程并返回一个指向某个对象的指针。该返回值可通过 pthread_join 函数的第二个参数得到。

- 函数原型

```c
#include <pthread.h>
void pthread_exit(void * retval);
```

- 参数解析

线程的需要返回的地址。

#### 实例：给三个单词按 ASCII 码进行字母顺序排序

```c
//filename: pthread.c
#include<stdio.h>
#include<pthread.h>
#include<stdlib.h>
#include<string.h>
struct start
{
 char str1[100];
 char str2[100];
 char str3[100];
};
void pop_sort(char * pstr)
{
 int i,j=0;
 int len = strlen(pstr);
 char temp;
 for(i=0;i<len;i++)
          {
                  for(j=0;j<len-i-1;j++)
                  {
                         if(*(pstr+j)>*(pstr+j+1))
                                  {
                                          temp = pstr[j];
                                          pstr[j] = pstr[j+1];
                                          pstr[j+1] = temp;
                                  }
                  }
          }
}
void * print_ch1(void * load)
{
 int k=0,len,i=0,j=0;
 char * pstr = *((char **)load);
 for(k=0;k<3;k++)
  {
   pstr = *((char **)load+k);
   len = strlen(pstr);
   pop_sort(pstr);
  }
printf("\n");
return NULL;
}
int main(void)
{
 pthread_t pth1,pth2;
 struct start load;
 int i=0;
 char *pload[]={load.str1,load.str2,load.str3};
 for(i=0;i<3;i++)
 {
  scanf("%s",pload[i]);
 }
 pthread_create(&pth1,NULL,print_ch1,pload);
 pthread_join(pth1,NULL);
 printf("%s\n",load.str1);
 printf("%s\n",load.str2);
 printf("%s\n",load.str3);
 return 1;
}
```

![](https://i2.buimg.com/580272/d13215e961c35a0e.png)

## 四、信号

### 4.1 信号的发送

#### alarm()

```c
#include <unistd.h>
unsigned int alarm(unsigned int seconds);
```

专门为 SIGALRM 信号而设，在指定的时间 seconds 秒后，将向进程本身发送 SIGALRM 信号，又称为闹钟时间。进程调用 alarm() 后，任何以前的 alarm() 调用都将无效。如果参数 seconds 为零，那么进程内将不再包含任何闹钟时间。 返回值，如果调用 alarm() 前，进程中已经设置了闹钟时间，则返回上一个闹钟时间的剩余时间，否则返回 0。

### 4.2 信号的安装

#### signal()

```c
#include <signal.h>
void(* signal (int signum, void (* handler))(int))(int);
```

如果该函数原型不容易理解的话，可以参考下面的分解方式来理解。

```c
typedef void(* sighandler_t)(int);
sighandler_t signal(int signum, sighandler_t handler);
```

第一个参数指定信号的值，第二个参数指定针对前面信号值的处理，可以忽略该信号（参数设为 SIG_IGN）；可以采用系统默认方式处理信号(参数设为 SIG_DFL)；也可以自己实现处理方式(参数指定一个函数地址)。  
如果 signal() 调用成功，返回最后一次为安装信号 signum 而调用 signal() 时的 handler 值；失败则返回 SIG_ERR。

```c
#include <stdio.h>
#include <signal.h>
#include <sys/wait.h>
#include <unistd.h>
#include <sys/types.h>
static int signum = 0;
void sig_usr_func(int num)
{
 signum++;
 printf("signum = %d\n",signum);
 if (signum<10)
 {
  alarm(1);
 }
}
int main(void)
{
 pid_t pid;
 signal(SIGALRM,sig_usr_func); // register method
 pid = fork();
 if (pid == 0)
 {
  int i = 0;
  alarm(1);
  for (int i = 0; i < 10; i++)
  {
   pause();
  }
  printf("Child process will exit...\n");
 }
 else if (pid > 0)
 {
  int i = 0;
  /*for (int i = 0; i < 10; i++)
  {
   kill(pid,SIGUSR1);
   sleep(1);
  }*/
  wait(0);
  printf("Parent process exit.\n");
 }
 return 1;
}
```

![](http://i1.piimg.com/580272/697b263d2df32ba7.png)

## 五、进程间通信

Linux 进程之间的通讯主要有以下几种：

1. 管道 pipe 和命名管道： 管道和亲缘关系进程间的通信，命名管道还允许无亲缘关系进程间通信
2. 管道 signal： 在软件层模拟中断机制，通知进程某事发生
3. 消息队列： 消息的链表包括 posix 消息队列和 SyxtemV 消息队列
4. 共享内存： 多个进程访问一块内存主要以同步
5. 信号量： 进程间同步
6. 套接字 socket： 不同机器之间进程通信

### 5.1 无名管道

管道是 Linux 进程间通信的一种方式，如命令：`ps -ef|grep ntp`
无名管道的特点：

1. 只能在亲缘关系进程间通信（父子或兄弟）
2. 半双工（固定的读端、写端）
3. 是特殊的文件，可用 read、write 函数进行操作，存在内存中

管道函数原型：

```c
#include <unistd.h>
int pipe(int fds[2]);
```

管道好比一条水管，有两个端口，一端进水，一端出水。函数 pipe(fds) 会创建一个管道，并且数组 fds 中的两个元素会成为管道读端、写端对应的文件描述符。其中：

**fds[0] 与读端相对应，有可读属性；fds[1] 与写端相对应，有可写属性**

通过调用 pipe 函数获取这对打开的文件描述符后，一个进程就可以从 fds[0] 中读数据，而另一个进程就可以往 fds[1] 中写数据。两个进程间必须有继承关系才能打开文件描述符。模型如下：

![](https://i2.buimg.com/580272/1a98836b6dfc9425.png)

### 5.2 System V 共享内存机制

#### 内存映射和共享内存的区别

内存映射：跟普通文件的读写相比，加快对文件、设备的访问速度  
共享内存：多进程间进行通信

#### ftok 函数

```c
#include <sys/types.h>
#include <sys/ipc.h>
key_t ftok(const char * pathname, int proj_id);
```

ftok 函数用于创建一个关键字，可以用该关键字关联一个共享内存段。

##### 参数

1. pathname：全路径文件名，并且该文件必须课访问
2. proj_id：通常传入一非 0 字符。通过 pathname 和 proj_id 组合可以创建唯一的 key。

##### 返回值

如果调用成功，返回一个关键字，否则返回 -1。

#### shmge 函数

```c
#include <sys/ipc.h>
#include <sys/shm.h>
int shmget(key_t key, size_t size, int shmflg);
```

shmge 函数用于创建或打开一共享内存段，该内存段有函数的第一个参数标识。函数成功则返回一个该共享内存段的唯一标识号，对任何进程都是唯一且相同的。

##### 参数

1. key 是一个与共享内存段相关联的关键字，若事先已经存在一个与指定关键字关联的共享内存段，则直接返回该内存段的标识。key 的值既可以用 ftok 函数产生，也可以是 IPC_RPIVATE (用于创建一个只属于创建进程的共享内存，主要用于父子通信），标识总是创建新的共享内存段。
2. size 指定共享内存段的大小，以字节为单位。
3. shmflg 是一掩码合成值，可以是访问权限值与（IPC_CREAT 或 IPC_EXCL）的合成。

#### shmat 函数

```c
#include <sys/types.h>
#include <sys/shm.h>
void * shmat(int shmid, const void * shmaddr, int shmflg);
```

函数 shmat 将与共享内存段映射到进程空间的某一地址。

##### 参数

1. shmid 是共享内存段的标识通常应该是 shmget 的成功返回值。
2. shmaddr 指定的是共享内存连接到当前进程中的地址位置。通常是 NULL，表示让系统来选择共享内存出现的地址。
3. shmflg 是一组位标识，通常为 0。若是 SHM_RDONLY 的话，就是只读模式。其他的是读写模式。

##### 返回值

如果调用成功，返回映射后的进程空间的首地址，否返回 (void \*)-1。

#### shmdt 函数

```c
#include <sys/types.h>
#include <sys/shm.h>
int shmdt(const void * shmaddr);
```

shmdt 函数用于将共享内存段与进程空间分离，与 shmat 函数相反。

##### 参数

1. shmaddr 通常为 shmat 的成功返回值。

##### 返回值

成功返回 0，失败时返回 -1。  
注意：只是将共享内存分离，并没有删除它，只是使得该共享内存对当前进程不再可用。

#### shmctl 函数

```c
#include <sys/ipc.h>
#include <sys/shm.h>
int shmctl(int shmid, int cmd, struct shmid_ds * buf);
```

函数 shmctl 是共享内存的控制函数，可以用来删除共享内存段。

##### 参数

1. shmid：共享内存段标识。通常是 shmget 的成功返回值。
2. cmd：对共享内存段的操作方式。

| 变量     | 描述                                                                                              |
| -------- | :------------------------------------------------------------------------------------------------ |
| IPC_STAT | 得到共享内存的状态，把共享内存的 shmid_ds 结构复制到 buf 中                                       |
| IPC_SET  | 改变共享内存状态，把 buf 所指的 shmid_ds 结构中的 uid, gid, mode 复制到共享内存的 shmid_ds 结构内 |
| IPC_RMID | 删除这片共享内存                                                                                  |

1. buf：标识共享内存段的信息结构体数据，通常为 NULL。

文件的复制操作

```c
#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/shm.h>
#include <sys/wait.h>
#include <stdlib.h>
#include <sys/ipc.h>
#define SHM_SIZE 300*1024
int main(int argc, char *argv[])
{
 pid_t pid;
 int retur;
 char * pload = NULL;
 int fpr = open(argv[1], O_RDONLY);
 int shmid = 0;
 key_t keyid = ftok ("/var/root/list", 'k'); // 产生键值
 printf("keyid = %d\n", keyid);
 shmid=shmget(keyid, SHM_SIZE, IPC_CREAT|0X777);// Alloc a new shared memory，7=4+2+1
 printf("shmid = %d\n", shmid);
 if (shmid<0)
 {
  exit(0);
 }
 pid = fork();
 if (pid == 0) // child
 {
  // char * pload = NULL;
  int fpr = open(argv[1], O_RDONLY);
  pload = shmat(shmid, NULL, 0);// Attach
  retur = read(fpr, pload, SHM_SIZE);
  shmdt(pload);
  printf("Child process retur = %d\n",retur);
  close(fpr);
 }
 else if (pid>0)
 {
  int fpw = open(argv[2],O_CREAT|O_WRONLY);
  sleep(1);
  pload = shmat(shmid, NULL, 0);// Attach
  retur = write(fpw, pload, SHM_SIZE);
  printf("Parent process retur = %d\n",retur);
  shmdt(pload);// Deattach
  shmctl(shmid, IPC_RMID, NULL);// Delete
  close(fpw);
  wait(0);
 }
 return 0;
}
```

![](https://i2.buimg.com/580272/28f14f45db28ad7d.png)

在 /root 目录下存放有 204,800 字节的 JPEG 文件「1.jpg」，gcc 编译并执行后输出的「2.jpg」。代码中定义 SHM_SIZE 大小为 300x1024 字节，因此复制成功后的图片大小也为 300x1024 = 307200 字节。
![](https://i2.buimg.com/580272/63c8b25dd391aa4e.png)

## 六、练习

从子进程中通过键盘获取 `ls -l /root`，子进程将该字符串通过一个管道传输给父进程，父进程将接受到的字符串 `ls -l /root` 通过另一个管道传回子进程，子进程读取这个字符串以后，进行解析，然后调用 `execvp` 函数去执行 `ls -l /root`。

```c
#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <string.h>
#include <unistd.h>
int main(void)
{
 pid_t pid;
 int fd1[2];
 int fd2[2];
 pipe(fd1);
 pipe(fd2);
 char buff[100];
 pid = fork();
  if (pid == 0)
  {
   char ch;
   int k=0;
   printf("Please input command string:\n");
   while((ch=getchar())!='\n')
   {
   buff[k]=ch;
    k++;
   }
   buff[k]='\0';
   close(fd1[0]);
   write(fd1[1],buff,k+1);
   printf("Step1: The string (%s) has been wrote!\n",buff);
   wait(0);
   //Processing Part:
   int i=0,j=1;
   char * pload[10];
   close(fd2[1]);
   read(fd2[0],buff,100);
   printf("Step4: Child processing %s\n",buff);
   pload[0]=buff;
   while(buff[i]!='\0')
  {
   if (buff[i]==' ')
   {
    buff[i]='\0';
    pload[j]=buff+i+1;
    j++;
   }
   i++;
  }
  pload[j]=NULL;
  execvp(pload[0],pload);
  }
  else if (pid > 0)
  {
   close(fd1[1]);
   read(fd1[0],buff,100);
   printf("Step2: The string (%s) sent to Parent process.\n",buff );
   close(fd1[0]);
   close(fd2[0]);
   write(fd2[1],buff,100);
   printf("Step3: The string (%s) sent to Child process.\n",buff );
   close(fd2[1]);
   wait(0);
  }
  printf("Done!\n");
 return 0;
}
```
