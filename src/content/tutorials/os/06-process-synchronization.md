---
title: "第六章：进程同步"
description: "了解临界区问题、Peterson 算法、硬件同步指令等进程同步机制"
---

# 第六章：进程同步

## 同步的基本概念

在多进程/多线程环境中，多个执行流可能同时访问共享资源，导致数据不一致。**进程同步**是确保多个进程/线程有序、安全地访问共享资源的机制。

### 竞争条件（Race Condition）

当多个进程并发访问和操作共享数据，且最终结果取决于执行顺序时，就发生了竞争条件。

```c
// 共享变量
int counter = 0;

// 两个进程同时执行
void increment() {
    counter++;  // 实际上包含三步：
                // 1. 读取 counter 到寄存器
                // 2. 寄存器值 +1
                // 3. 写回 counter
}

// 进程 A 和进程 B 同时调用 increment()
// 期望结果：counter = 2
// 实际可能：counter = 1（交错执行导致）
```

交错执行示例：

```
时间  进程 A              进程 B
─────────────────────────────────────
t1   读取 counter (=0)
t2                        读取 counter (=0)
t3   counter + 1 (=1)
t4                        counter + 1 (=1)
t5   写回 counter (=1)
t6                        写回 counter (=1)
→ 结果：counter = 1（错误！）
```

::: info
要避免竞争条件，必须确保多个进程在访问共享数据时是**互斥**的——即同一时刻只有一个进程在操作共享数据。
:::

## 临界区问题

### 临界区模型

```
┌─────────────────────────────┐
│         进入区（Entry Section）  │  ← 请求进入临界区的代码
├─────────────────────────────┤
│         临界区（Critical Section）│  ← 访问共享资源的代码
├─────────────────────────────┤
│         退出区（Exit Section）   │  ← 释放临界区的代码
├─────────────────────────────┤
│         剩余区（Remainder Section）│ ← 其他代码
└─────────────────────────────┘
```

### 临界区问题的三个要求

| 要求 | 说明 |
| --- | --- |
| 互斥（Mutual Exclusion） | 同一时刻最多只有一个进程在临界区内 |
| 前进（Progress） | 如果没有进程在临界区内，且有进程想进入，则应该让它们中的一个进入，不能无限期推迟 |
| 有界等待（Bounded Waiting） | 进程请求进入临界区后，必须在有限步内获得许可进入 |

## Peterson 算法

**Peterson 算法**是 1981 年由 Gary Peterson 提出的软件解决方案，用于解决两个进程的临界区问题。

### 算法实现

```c
// 共享变量
int turn;           // 表示谁应该进入临界区
boolean flag[2];    // 表示进程是否想进入临界区

// 进程 i 的代码（j = 1 - i）
do {
    // 进入区
    flag[i] = true;         // 表示进程 i 想进入
    turn = j;               // 让给对方

    // 等待条件：对方也想进入 且 轮到对方
    while (flag[j] && turn == j);

    // 临界区
    // ... 访问共享资源 ...

    // 退出区
    flag[i] = false;        // 表示进程 i 离开

    // 剩余区
    // ... 其他操作 ...
} while (true);
```

### 正确性分析

| 要求 | 是否满足 | 说明 |
| --- | --- | --- |
| 互斥 | ✅ | 两个进程不能同时在临界区 |
| 前进 | ✅ | 如果只有一个进程想进入，它可以立即进入 |
| 有界等待 | ✅ | 每个进程最多等待一次 |

::: tip
Peterson 算法仅适用于两个进程。对于多进程场景，需要使用更通用的方法（如信号量、硬件指令等）。
:::

## 硬件同步指令

现代计算机体系结构提供了特殊的硬件指令来支持同步操作。

### 测试并设置（Test-and-Set）

原子地读取并修改一个内存位置。

```c
boolean TestAndSet(boolean *target) {
    boolean old = *target;
    *target = true;
    return old;
}

// 使用 Test-and-Set 实现互斥
boolean lock = false;  // 共享锁

do {
    // 进入区
    while (TestAndSet(&lock));  // 自旋等待

    // 临界区
    // ... 访问共享资源 ...

    // 退出区
    lock = false;

    // 剩余区
} while (true);
```

### 交换（Swap）

原子地交换两个内存位置的值。

```c
void Swap(boolean *a, boolean *b) {
    boolean temp = *a;
    *a = *b;
    *b = temp;
}

// 使用 Swap 实现互斥
boolean lock = false;

do {
    boolean key = true;
    while (key) {
        Swap(&lock, &key);  // 原子交换
    }

    // 临界区
    // ... 访问共享资源 ...

    // 退出区
    lock = false;

    // 剩余区
} while (true);
```

### 比较并交换（Compare-and-Swap, CAS）

```c
int CompareAndSwap(int *value, int expected, int new_value) {
    int temp = *value;
    if (*value == expected) {
        *value = new_value;
    }
    return temp;
}
```

::: info
这些硬件指令都是**原子操作**——在执行过程中不会被中断。它们是实现同步原语的基础，但使用不当可能导致**忙等待（Busy Waiting）**，浪费 CPU 资源。
:::

### 硬件指令方案的问题

| 问题 | 说明 |
| --- | --- |
| 忙等待 | 进程在等待锁时持续消耗 CPU |
| 饥饿 | 等待的进程可能无限期等待 |
| 死锁 | 多个进程互相等待 |

## 信号量（Semaphore）

**信号量**是 Dijkstra 提出的一种更高级的同步工具，解决了硬件方案中忙等待的问题。

### 信号量的定义

```c
// 信号量是一个整数变量，只能通过两个原子操作访问
void wait(semaphore *S) {    // 也叫 P 操作、down 操作
    S->value--;
    if (S->value < 0) {
        // 阻塞当前进程
        block();
    }
}

void signal(semaphore *S) {  // 也叫 V 操作、up 操作
    S->value++;
    if (S->value <= 0) {
        // 唤醒一个等待的进程
        wakeup();
    }
}
```

### 信号量类型

| 类型 | 值域 | 用途 |
| --- | --- | --- |
| 计数信号量 | 任意非负整数 | 控制对多个资源的访问 |
| 二值信号量（互斥锁） | 0 或 1 | 实现互斥访问 |

### 使用信号量实现互斥

```c
semaphore mutex = 1;  // 初始值为 1

// 进程 Pi
do {
    wait(mutex);      // 进入区
    // 临界区
    signal(mutex);    // 退出区
    // 剩余区
} while (true);
```

### 使用信号量实现同步

```c
// 进程 P1 执行完 S1 后，P2 才能执行 S2
semaphore sync = 0;

// 进程 P1
S1;
signal(sync);

// 进程 P2
wait(sync);
S2;
```

::: tip
信号量的关键优势是**没有忙等待**。当进程无法获得信号量时，它会被阻塞并放入等待队列，不消耗 CPU 资源。
:::

## 管程（Monitor）

**管程**是一种高级同步构造，将共享数据和操作封装在一起，确保同一时刻只有一个进程在管程内活动。

```
monitor MonitorName {
    // 共享变量
    int count;

    // 条件变量
    condition full, empty;

    // 操作
    void produce() {
        // ...
    }

    void consume() {
        // ...
    }

    // 初始化
    init() {
        count = 0;
    }
}
```

### 管程的特点

| 特点 | 说明 |
| --- | --- |
| 模块化 | 将共享资源及其操作封装在一起 |
| 互斥 | 自动保证同一时刻只有一个进程在管程内 |
| 条件变量 | 通过 wait/signal 实现进程间的同步 |

::: info
管程的优点是安全性高（编译器保证互斥），但灵活性不如信号量。Java 中的 `synchronized` 关键字和 `ReentrantLock` 就是管程思想的实现。
:::

## 本章小结

- 竞争条件发生在多个进程并发访问共享数据时
- 临界区问题需要满足互斥、前进和有界等待三个条件
- **Peterson 算法**是经典的软件解决方案，适用于两个进程
- **硬件同步指令**（Test-and-Set、Swap、CAS）提供原子操作，但可能导致忙等待
- **信号量**是更高级的同步工具，避免了忙等待
- **管程**封装了共享数据和操作，提供自动互斥保证
