---
title: '第十三章：多线程与并发'
description: 'Thread、Runnable、线程池、synchronized、Lock'
---

# 第十三章：多线程与并发

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是多线程？程序不是只能一行一行执行吗？
- 为什么要用多线程？单线程不够用吗？
- 多个线程同时修改数据会出问题吗？怎么解决？
- 线程池是什么？为什么要用线程池而不是直接创建线程？

这一章就是为了解答这些问题。我们会先搞清楚 **多线程的核心概念**，再动手实践线程创建、同步机制和线程池。学完这章，你就能编写高效的多线程程序了。

---

## 13.1 为什么需要多线程？

### 痛点分析

想象你要下载 100 张图片，单线程只能一张张下载：

```java
// ❌ 单线程：串行下载，速度慢
for (int i = 0; i < 100; i++) {
    downloadImage("image" + i + ".jpg");  // 下载一张，等 1 秒
}
// 总共需要 100 秒
```

单线程的问题：**一次只能做一件事，效率低**。

### 解决方案

```java
// ✅ 多线程：并行下载，速度快
for (int i = 0; i < 100; i++) {
    new Thread(() -> {
        downloadImage("image" + i + ".jpg");  // 每个线程下载一张
    }).start();
}
// 多个线程同时下载，可能只需要 10 秒
```

> **一句话总结**：多线程让程序同时做多件事，提高效率。

### 生活类比

打个比方：

> 单线程就像**一个收银员**——顾客排队结账，一个一个来，慢得要命。多线程就像**多个收银员**——多个顾客同时结账，速度快多了。

---

## 13.2 核心原理

### 线程生命周期

```
新建（NEW）
  ↓ start()
就绪（RUNNABLE）←→ 运行中
  ↓ 调用 sleep()/wait()/join() 或等待锁
阻塞/等待（BLOCKED/WAITING）
  ↓ 条件满足
就绪（重新进入就绪状态）
  ↓ run() 方法执行完毕
终止（TERMINATED）
```

打个比方：

> 线程就像**人**——新建是"出生"，就绪是"准备好了"，运行是"正在工作"，阻塞是"休息等待"，终止是"退休"。

### 线程安全问题

多个线程同时修改共享数据时，可能出现数据不一致。

```java
// ❌ 线程不安全：多个线程同时修改 count
class Counter {
    private int count = 0;

    public void increment() {
        count++;  // 不是原子操作，可能被中断
    }
}

// 1000 个线程各执行 1 次 increment
Counter counter = new Counter();
for (int i = 0; i < 1000; i++) {
    new Thread(counter::increment).start();
}
System.out.println(counter.count);  // 可能不是 1000！
```

**为什么？** `count++` 实际上是三步：

1. 读取 count 的值
2. 加 1
3. 写回 count

如果两个线程同时执行第 1 步，读到的都是同一个值，然后各自加 1 写回，结果就少了 1。

---

## 13.3 基础用法

### 创建线程

#### 方式 1：继承 Thread 类

```java
// 定义线程类，继承 Thread
public class MyThread extends Thread {
    @Override
    public void run() {
        // 线程要执行的代码
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + ": " + i);
        }
    }
}

// 创建并启动线程
MyThread t = new MyThread();
t.start();    // 启动线程，JVM 自动调用 run()
```

#### 方式 2：实现 Runnable 接口（推荐）

```java
// 定义任务类，实现 Runnable 接口
public class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("线程运行: " + Thread.currentThread().getName());
    }
}

// 创建线程并传入任务
Thread t = new Thread(new MyRunnable());
t.start();

// Lambda 写法（更简洁）
Thread t2 = new Thread(() -> {
    System.out.println("Lambda 线程");
});
t2.start();
```

#### 方式 3：实现 Callable 接口（有返回值）

```java
import java.util.concurrent.*;

// Callable 可以有返回值
Callable<Integer> task = () -> {
    int sum = 0;
    for (int i = 1; i <= 100; i++) {
        sum += i;
    }
    return sum;  // 返回计算结果
};

// FutureTask 包装 Callable
FutureTask<Integer> futureTask = new FutureTask<>(task);
new Thread(futureTask).start();  // 启动线程

Integer result = futureTask.get();    // 阻塞等待结果
System.out.println(result);           // 输出：5050
```

### 线程常用方法

```java
Thread t = new Thread(() -> {
    try {
        Thread.sleep(1000);    // 休眠 1 秒，让出 CPU
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
});

t.start();
t.join();           // 等待该线程结束，主线程才继续
t.setPriority(5);   // 设置优先级（1-10），数字越大优先级越高
System.out.println(t.isAlive());  // 判断线程是否存活
```

### 线程同步

#### synchronized 关键字

```java
public class Counter {
    private int count = 0;

    // 同步方法：同一时刻只有一个线程能执行
    public synchronized void increment() {
        count++;  // 原子操作，不会被中断
    }

    public int getCount() {
        return count;
    }
}

// 使用
Counter counter = new Counter();
for (int i = 0; i < 1000; i++) {
    new Thread(counter::increment).start();
}
// 现在 count 一定是 1000
```

#### synchronized 代码块

```java
public class BankAccount {
    private double balance;
    private final Object lock = new Object();  // 锁对象

    public void withdraw(double amount) {
        synchronized (lock) {  // 只锁住关键代码
            if (balance >= amount) {
                balance -= amount;
                System.out.println("取款成功，余额: " + balance);
            }
        }
    }
}
```

#### Lock 接口（更灵活）

```java
import java.util.concurrent.locks.*;

public class SafeCounter {
    private int count = 0;
    private final Lock lock = new ReentrantLock();  // 可重入锁

    public void increment() {
        lock.lock();  // 获取锁
        try {
            count++;
        } finally {
            lock.unlock();    // 必须在 finally 中释放锁
        }
    }
}
```

### 线程池

```java
import java.util.concurrent.*;

// 创建固定大小的线程池（5 个线程）
ExecutorService pool = Executors.newFixedThreadPool(5);

// 提交任务
for (int i = 0; i < 10; i++) {
    pool.submit(() -> {
        System.out.println("线程: " + Thread.currentThread().getName());
    });
}

// 关闭线程池（不再接受新任务，等待已有任务完成）
pool.shutdown();
```

#### 自定义线程池

```java
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    2,                      // 核心线程数（常驻线程）
    5,                      // 最大线程数（高峰期最多 5 个）
    60, TimeUnit.SECONDS,   // 空闲线程存活时间
    new LinkedBlockingQueue<>(100),  // 任务队列（最多 100 个任务）
    Executors.defaultThreadFactory(),
    new ThreadPoolExecutor.CallerRunsPolicy()  // 拒绝策略：队列满时由调用者执行
);

pool.execute(() -> {
    System.out.println("任务执行");
});

pool.shutdown();
```

### 线程间通信

```java
public class ProducerConsumer {
    private final List<Integer> list = new ArrayList<>();
    private final int MAX = 10;

    // 生产者
    public synchronized void produce() throws InterruptedException {
        while (list.size() == MAX) {
            wait();    // 队列满了，等待
        }
        list.add(1);
        System.out.println("生产，当前数量: " + list.size());
        notifyAll();   // 唤醒等待的线程
    }

    // 消费者
    public synchronized void consume() throws InterruptedException {
        while (list.isEmpty()) {
            wait();    // 队列空了，等待
        }
        list.remove(0);
        System.out.println("消费，当前数量: " + list.size());
        notifyAll();   // 唤醒等待的线程
    }
}
```

---

## 13.4 线程安全集合

### ConcurrentHashMap

```java
import java.util.concurrent.ConcurrentHashMap;

ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();

// 线程安全的操作
map.put("key1", 100);
map.putIfAbsent("key2", 200);  // 如果不存在才放入

// 原子操作
map.compute("key1", (k, v) -> v == null ? 1 : v + 1);
map.merge("key2", 1, Integer::sum);

// 批量操作
map.forEach(10, (k, v) -> System.out.println(k + ": " + v));
```

### CopyOnWriteArrayList

```java
import java.util.concurrent.CopyOnWriteArrayList;

// 适合读多写少的场景
CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();

list.add("A");
list.add("B");

// 迭代时修改不会影响迭代器
for (String item : list) {
    System.out.println(item);
    list.add("C");  // 不会抛出 ConcurrentModificationException
}
```

### 原子类

```java
import java.util.concurrent.atomic.AtomicInteger;

AtomicInteger counter = new AtomicInteger(0);

// 原子操作（线程安全，无需同步）
counter.incrementAndGet();  // +1 并返回
counter.decrementAndGet();  // -1 并返回
counter.addAndGet(10);      // +10 并返回
counter.compareAndSet(10, 20);  // CAS 操作：如果当前值是 10，则设为 20

// 线程安全
for (int i = 0; i < 1000; i++) {
    new Thread(() -> counter.incrementAndGet()).start();
}
```

### volatile 关键字

```java
public class VolatileExample {
    private volatile boolean running = true;

    public void stop() {
        running = false;  // 对其他线程立即可见
    }

    public void run() {
        while (running) {
            // 持续运行
        }
    }
}
```

::: warning volatile 特点

1. 保证可见性：一个线程修改后，其他线程立即可见
2. 禁止指令重排序
3. 不保证原子性（如 i++ 不是原子操作）

:::

---

## 13.5 同步工具类

### CountDownLatch（倒计时门闩）

```java
import java.util.concurrent.CountDownLatch;

public class Race {
    public static void main(String[] args) throws InterruptedException {
        int runnerCount = 5;
        CountDownLatch startSignal = new CountDownLatch(1);  // 起跑信号
        CountDownLatch doneSignal = new CountDownLatch(runnerCount);  // 完成信号

        // 创建运动员
        for (int i = 0; i < runnerCount; i++) {
            new Thread(() -> {
                try {
                    startSignal.await();  // 等待起跑信号
                    System.out.println(Thread.currentThread().getName() + " 起跑");
                    Thread.sleep((long)(Math.random() * 1000));
                    System.out.println(Thread.currentThread().getName() + " 到达终点");
                    doneSignal.countDown();  // 完成比赛，计数减 1
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }).start();
        }

        Thread.sleep(1000);  // 准备时间
        startSignal.countDown();  // 发令枪响
        doneSignal.await();  // 等待所有运动员完成
        System.out.println("比赛结束");
    }
}
```

### CyclicBarrier（循环栅栏）

```java
import java.util.concurrent.CyclicBarrier;

public class Meeting {
    public static void main(String[] args) {
        int participants = 3;
        CyclicBarrier barrier = new CyclicBarrier(participants, () -> {
            System.out.println("所有人员到齐，会议开始");
        });

        for (int i = 0; i < participants; i++) {
            final String name = "人员" + (i + 1);
            new Thread(() -> {
                try {
                    System.out.println(name + " 到达会议室");
                    Thread.sleep((long)(Math.random() * 1000));
                    barrier.await();  // 等待其他人
                    System.out.println(name + " 开始开会");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }).start();
        }
    }
}
```

### Semaphore（信号量）

```java
import java.util.concurrent.Semaphore;

public class ParkingLot {
    private static final int PARKING_SPOTS = 3;
    private static final Semaphore semaphore = new Semaphore(PARKING_SPOTS);

    public static void main(String[] args) {
        for (int i = 0; i < 10; i++) {
            final String carName = "车辆" + (i + 1);
            new Thread(() -> {
                try {
                    semaphore.acquire();  // 获取停车位（信号量减 1）
                    System.out.println(carName + " 停车");
                    Thread.sleep(2000);  // 停车 2 秒
                    System.out.println(carName + " 离开");
                    semaphore.release();  // 释放停车位（信号量加 1）
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }).start();
        }
    }
}
```

---

## 13.6 新手常见误区

### 误区 1：调用 run() 而不是 start()

**错！** 调用 run() 只是普通方法调用，不会启动新线程。

```java
Thread t = new Thread(() -> {
    System.out.println("线程运行");
});

// ❌ 错误：直接调用 run()
t.run();  // 在主线程中执行，没有启动新线程

// ✅ 正确：调用 start()
t.start();  // 启动新线程，JVM 调用 run()
```

### 误区 2：多个线程共享同一个变量不需要同步

**错！** 多个线程同时修改共享变量会导致数据不一致。

```java
// ❌ 错误：没有同步
class Counter {
    private int count = 0;
    public void increment() {
        count++;  // 不是原子操作
    }
}

// ✅ 正确：使用 synchronized
class Counter {
    private int count = 0;
    public synchronized void increment() {
        count++;
    }
}
```

### 误区 3：线程池可以无限创建线程

**错！** 线程池有最大线程数限制，超过会触发拒绝策略。

```java
// 线程池参数
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    2,                      // 核心线程数
    5,                      // 最大线程数
    60, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(100),  // 队列容量 100
    new ThreadPoolExecutor.CallerRunsPolicy()  // 拒绝策略
);

// 如果提交 1000 个任务，超过 5 + 100 = 105 个任务会触发拒绝策略
```

### 误区 4：synchronized 锁的是方法

**错！** synchronized 锁的是对象（this 或指定的锁对象）。

```java
// synchronized 方法锁的是 this（当前对象）
public synchronized void method() {
    // 锁的是 this
}

// 等价于
public void method() {
    synchronized (this) {
        // 锁的是 this
    }
}
```

### 误区 5：volatile 可以替代 synchronized

**错！** volatile 只保证可见性，不保证原子性。

```java
// ❌ 错误：volatile 不能保证 i++ 的原子性
private volatile int count = 0;
public void increment() {
    count++;  // 不是原子操作，可能出错
}

// ✅ 正确：使用 synchronized 或原子类
private AtomicInteger count = new AtomicInteger(0);
public void increment() {
    count.incrementAndGet();  // 原子操作
}
```

---

## 13.7 动手练习

### 练习 1：基础练习 —— 多线程计数

创建 10 个线程，每个线程执行 100 次 `count++`，最终输出 count 的值。使用 synchronized 保证线程安全。

<details>
<summary>点击查看答案</summary>

```java
public class ThreadCount {
    private static int count = 0;  // 共享变量
    private static final Object lock = new Object();  // 锁对象

    public static void main(String[] args) throws InterruptedException {
        Thread[] threads = new Thread[10];

        // 创建 10 个线程
        for (int i = 0; i < 10; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 100; j++) {
                    synchronized (lock) {  // 同步代码块
                        count++;
                    }
                }
            });
            threads[i].start();
        }

        // 等待所有线程结束
        for (Thread t : threads) {
            t.join();
        }

        System.out.println("最终 count: " + count);  // 输出：1000
    }
}
```

</details>

### 练习 2：进阶练习 —— 生产者消费者模型

实现一个简单的生产者消费者模型，生产者生产数字，消费者消费数字，使用 wait/notify 实现线程间通信。

<details>
<summary>点击查看答案</summary>

```java
import java.util.ArrayList;
import java.util.List;

public class ProducerConsumer {
    private final List<Integer> queue = new ArrayList<>();
    private final int MAX_SIZE = 10;

    // 生产者
    public synchronized void produce(int value) throws InterruptedException {
        while (queue.size() == MAX_SIZE) {
            System.out.println("队列已满，等待...");
            wait();  // 队列满，等待
        }
        queue.add(value);
        System.out.println("生产: " + value + "，队列大小: " + queue.size());
        notifyAll();  // 唤醒消费者
    }

    // 消费者
    public synchronized int consume() throws InterruptedException {
        while (queue.isEmpty()) {
            System.out.println("队列为空，等待...");
            wait();  // 队列空，等待
        }
        int value = queue.remove(0);
        System.out.println("消费: " + value + "，队列大小: " + queue.size());
        notifyAll();  // 唤醒生产者
        return value;
    }

    public static void main(String[] args) {
        ProducerConsumer pc = new ProducerConsumer();

        // 生产者线程
        new Thread(() -> {
            try {
                for (int i = 1; i <= 20; i++) {
                    pc.produce(i);
                    Thread.sleep(100);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();

        // 消费者线程
        new Thread(() -> {
            try {
                for (int i = 1; i <= 20; i++) {
                    pc.consume();
                    Thread.sleep(150);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }
}
```

</details>

### 练习 3（挑战）：综合练习 —— 线程池任务调度

使用线程池执行 10 个任务，每个任务模拟耗时操作，统计总耗时。

<details>
<summary>点击查看答案</summary>

```java
import java.util.concurrent.*;

public class ThreadPoolDemo {
    public static void main(String[] args) {
        // 创建固定大小的线程池（5 个线程）
        ExecutorService pool = Executors.newFixedThreadPool(5);

        long startTime = System.currentTimeMillis();

        // 提交 10 个任务
        for (int i = 1; i <= 10; i++) {
            final int taskId = i;
            pool.submit(() -> {
                try {
                    System.out.println("任务 " + taskId + " 开始");
                    Thread.sleep(1000);  // 模拟耗时操作
                    System.out.println("任务 " + taskId + " 完成");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            });
        }

        // 关闭线程池
        pool.shutdown();
        try {
            pool.awaitTermination(1, java.util.concurrent.TimeUnit.MINUTES);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        long endTime = System.currentTimeMillis();
        System.out.println("总耗时: " + (endTime - startTime) + "ms");
        // 5 个线程并行执行 10 个任务，总耗时约 2 秒（而不是 10 秒）
    }
}
```

</details>

---

## 13.8 核心知识点

| 知识点       | 说明                                                   |
| ------------ | ------------------------------------------------------ |
| 创建线程     | 继承 Thread、实现 Runnable、实现 Callable              |
| 线程安全     | synchronized、Lock、原子类、volatile                   |
| 线程池       | FixedThreadPool、CachedThreadPool、ScheduledThreadPool |
| 同步工具     | CountDownLatch、CyclicBarrier、Semaphore               |
| 线程通信     | wait/notify/notifyAll                                  |
| 线程安全集合 | ConcurrentHashMap、CopyOnWriteArrayList                |

---

## 下一章预告

下一章我们会学习 **Lambda 与 Stream API**——Java 8 引入的函数式编程特性。你会学到 Lambda 表达式、函数式接口、Stream 操作（filter、map、reduce）。学完这章，你就能写出更简洁、更优雅的代码了。
