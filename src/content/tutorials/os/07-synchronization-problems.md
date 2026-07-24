---
title: "第七章：经典同步问题"
description: "了解生产者-消费者、读者-写者、哲学家进餐等经典进程同步问题及其解决方案"
---

# 第七章：经典同步问题

## 生产者-消费者问题

**生产者-消费者问题（Producer-Consumer Problem）** 也称为有界缓冲区问题，是最经典的进程同步问题之一。

### 问题描述

- 一组生产者进程生产数据放入缓冲区
- 一组消费者进程从缓冲区取出数据消费
- 缓冲区大小有限，满时生产者不能放入，空时消费者不能取出

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│  生产者   │ ──> │   缓冲区     │ ──> │  消费者   │
│ Producer │     │   Buffer     │     │ Consumer │
└──────────┘     └──────────────┘     └──────────┘
```

### 使用信号量解决

```c
// 信号量
semaphore empty = N;    // 空位数量，初始为缓冲区大小 N
semaphore full = 0;     // 满位数量，初始为 0
semaphore mutex = 1;    // 互斥信号量

// 生产者
void producer() {
    while (true) {
        item = produce();       // 生产一个产品
        wait(empty);            // 等待空位
        wait(mutex);            // 进入临界区
        insert(item);           // 放入缓冲区
        signal(mutex);          // 离开临界区
        signal(full);           // 增加满位计数
    }
}

// 消费者
void consumer() {
    while (true) {
        wait(full);             // 等待产品
        wait(mutex);            // 进入临界区
        item = remove();        // 从缓冲区取出
        signal(mutex);          // 离开临界区
        signal(empty);          // 增加空位计数
        consume(item);          // 消费产品
    }
}
```

::: tip
注意 `wait(empty)` 和 `wait(mutex)` 的顺序不能颠倒！如果先 `wait(mutex)` 再 `wait(empty)`，当缓冲区满时，生产者会持有 mutex 并等待 empty，消费者也无法获取 mutex 来消费，导致**死锁**。
:::

### 执行流程示例

```
初始状态：empty = 3, full = 0, mutex = 1

生产者 P1：
  wait(empty)  → empty = 2
  wait(mutex)  → mutex = 0
  insert(item) → 缓冲区 [item1]
  signal(mutex)→ mutex = 1
  signal(full) → full = 1

消费者 C1：
  wait(full)   → full = 0
  wait(mutex)  → mutex = 0
  remove()     → 取出 item1
  signal(mutex)→ mutex = 1
  signal(empty)→ empty = 3
```

## 读者-写者问题

**读者-写者问题（Readers-Writers Problem）** 描述多个进程共享一个数据对象，其中一些只读，一些要写。

### 问题描述

- 多个读者可以同时读取共享数据
- 写者必须独占访问（写时不能有读者或其他写者）
- 如何协调读者和写者的访问？

### 第一类读者-写者（读者优先）

```c
semaphore mutex = 1;     // 保护 readCount
semaphore wrt = 1;       // 写者互斥
int readCount = 0;       // 读者计数

// 读者
void reader() {
    while (true) {
        wait(mutex);             // 进入区
        readCount++;             // 增加读者计数
        if (readCount == 1) {    // 第一个读者
            wait(wrt);           // 阻止写者
        }
        signal(mutex);           // 离开区

        // 读取数据（多个读者可同时进行）
        readData();

        wait(mutex);             // 进入区
        readCount--;             // 减少读者计数
        if (readCount == 0) {    // 最后一个读者
            signal(wrt);         // 允许写者
        }
        signal(mutex);           // 离开区
    }
}

// 写者
void writer() {
    while (true) {
        wait(wrt);               // 等待无读者和写者
        writeData();             // 写入数据
        signal(wrt);             // 释放
    }
}
```

### 第二类读者-写者（写者优先）

```c
semaphore mutex = 1;
semaphore wrt = 1;
semaphore r = 1;           // 读者排队信号量
int readCount = 0;

// 读者
void reader() {
    while (true) {
        wait(r);                 // 等待写者放行
        wait(mutex);
        readCount++;
        if (readCount == 1) {
            wait(wrt);           // 第一个读者阻止写者
        }
        signal(mutex);
        signal(r);               // 放行下一个读者

        readData();

        wait(mutex);
        readCount--;
        if (readCount == 0) {
            signal(wrt);
        }
        signal(mutex);
    }
}

// 写者
void writer() {
    while (true) {
        wait(r);                 // 阻止新读者进入
        wait(wrt);
        writeData();
        signal(wrt);
        signal(r);               // 放行读者
    }
}
```

| 策略 | 特点 | 风险 |
| --- | --- | --- |
| 读者优先 | 新读者可以立即进入 | 写者可能饥饿 |
| 写者优先 | 新写者到达后，阻止新读者 | 读者可能饥饿 |

::: info
实际应用中，通常采用折中方案（如 Linux 的 `rwlock`），在公平性和性能之间取得平衡。
:::

## 哲学家进餐问题

**哲学家进餐问题（Dining Philosophers Problem）** 由 Dijkstra 提出，用于说明同步问题和死锁。

### 问题描述

- 5 个哲学家围坐在圆桌旁
- 每人左右各有一根筷子，共 5 根筷子
- 哲学家交替思考和进餐
- 进餐时需要同时拿到左右两根筷子
- 如何避免死锁和饥饿？

```
          哲学家 0
          /      \
     筷子 4      筷子 0
        /          \
  哲学家 4    哲学家 1
        \          /
     筷子 3      筷子 1
          \      /
          哲学家 3
             |
          筷子 2
          哲学家 2
```

### 错误解法（会导致死锁）

```c
semaphore chopstick[5] = {1, 1, 1, 1, 1};

void philosopher(int i) {
    while (true) {
        think();
        wait(chopstick[i]);           // 拿左筷子
        wait(chopstick[(i+1) % 5]);   // 拿右筷子
        eat();
        signal(chopstick[i]);         // 放左筷子
        signal(chopstick[(i+1) % 5]); // 放右筷子
    }
}
```

::: info
如果 5 个哲学家同时拿起左筷子，然后都在等待右筷子，就会发生死锁——每个人都在等，没人能进餐。
:::

### 解决方案一：限制最多 4 个哲学家同时拿筷子

```c
semaphore chopstick[5] = {1, 1, 1, 1, 1};
semaphore room = 4;  // 最多允许 4 人同时尝试

void philosopher(int i) {
    while (true) {
        think();
        wait(room);                    // 进入房间
        wait(chopstick[i]);            // 拿左筷子
        wait(chopstick[(i+1) % 5]);    // 拿右筷子
        eat();
        signal(chopstick[i]);          // 放左筷子
        signal(chopstick[(i+1) % 5]);  // 放右筷子
        signal(room);                  // 离开房间
    }
}
```

### 解决方案二：奇数先拿左，偶数先拿右

```c
void philosopher(int i) {
    while (true) {
        think();
        if (i % 2 == 0) {
            wait(chopstick[(i+1) % 5]);  // 先拿右
            wait(chopstick[i]);           // 再拿左
        } else {
            wait(chopstick[i]);           // 先拿左
            wait(chopstick[(i+1) % 5]);   // 再拿右
        }
        eat();
        signal(chopstick[i]);
        signal(chopstick[(i+1) % 5]);
    }
}
```

### 解决方案三：只有左右筷子都可用时才拿

```c
void philosopher(int i) {
    while (true) {
        think();
        // 使用 TestAndSet 原子操作
        while (true) {
            wait(mutex);
            int left = i;
            int right = (i + 1) % 5;
            if (chopstick[left] == 1 && chopstick[right] == 1) {
                chopstick[left] = 0;
                chopstick[right] = 0;
                signal(mutex);
                break;
            }
            signal(mutex);
            // 等待一下再试
        }
        eat();
        chopstick[left] = 1;
        chopstick[right] = 1;
    }
}
```

| 解决方案 | 原理 | 优缺点 |
| --- | --- | --- |
| 限制人数 | 破坏循环等待条件 | 简单，但降低并发度 |
| 奇偶策略 | 破坏循环等待条件 | 保证至少一人能进餐 |
| 同时拿取 | 破坏持有并等待条件 | 可能饥饿 |

## 本章小结

- **生产者-消费者问题**：使用信号量 `empty`、`full`、`mutex` 协调生产者和消费者
- **读者-写者问题**：读者优先策略可能导致写者饥饿，写者优先策略可能导致读者饥饿
- **哲学家进餐问题**：通过限制人数、奇偶策略或同时拿取等方式避免死锁
- 解决同步问题的关键是**破坏死锁的四个必要条件**之一
