---
title: '第十七章：多线程与并发'
description: 'Thread、Runnable、线程池、synchronized、Lock'
---

# 第十七章：多线程与并发

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是多线程？程序不是只能一行一行执行吗？
- 为什么要用多线程？单线程不够用吗？
- 多个线程同时修改数据会出问题吗？怎么解决？
- 线程池是什么？为什么要用线程池而不是直接创建线程？

这一章就是为了解答这些问题。我们会先搞清楚 **多线程的核心概念**，再动手实践线程创建、同步机制和线程池。学完这章，你就能编写高效的多线程程序了。

---

## 1 为什么需要多线程？

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

## 2 核心原理

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

## 3 基础用法

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

## 4 线程安全集合

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

## 5 同步工具类

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

## 6 线程中断机制

### 中断的概念

线程中断是一种协作机制，一个线程可以通过中断来通知另一个线程应该停止执行。

打个比方：

> 中断就像**拍肩膀**——你拍拍同事的肩膀说"别干了"，但同事可以选择继续干或者停下来。中断不是强制停止，而是"建议"停止。

### 中断相关方法

```java
public class InterruptDemo {
    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(() -> {
            // 方式 1：检查中断状态
            while (!Thread.currentThread().isInterrupted()) {
                System.out.println("线程运行中...");
                try {
                    Thread.sleep(1000);  // 睡眠时会响应中断
                } catch (InterruptedException e) {
                    System.out.println("收到中断信号，线程退出");
                    return;  // 退出线程
                }
            }
        });

        thread.start();
        Thread.sleep(2000);  // 主线程等待 2 秒
        thread.interrupt();  // 发送中断信号
    }
}
```

### 三个中断方法的区别

```java
// 1. interrupt() - 发送中断信号
thread.interrupt();  // 设置中断标志为 true

// 2. isInterrupted() - 检查中断状态（不改变标志）
boolean interrupted = thread.isInterrupted();  // 返回中断标志

// 3. interrupted() - 检查并清除中断状态（静态方法）
boolean wasInterrupted = Thread.interrupted();  // 返回中断标志，并重置为 false
```

### 正确响应中断

```java
// ✅ 正确方式 1：在循环中检查中断状态
public void run() {
    while (!Thread.currentThread().isInterrupted()) {
        // 执行任务
    }
}

// ✅ 正确方式 2：捕获 InterruptedException
public void run() {
    try {
        while (!Thread.currentThread().isInterrupted()) {
            Thread.sleep(1000);
        }
    } catch (InterruptedException e) {
        // 恢复中断状态
        Thread.currentThread().interrupt();
        // 清理资源并退出
    }
}

// ❌ 错误方式：吞掉中断异常
public void run() {
    try {
        Thread.sleep(1000);
    } catch (InterruptedException e) {
        // 什么都不做，中断信号被吞掉
    }
}
```

---

## 7 守护线程

### 什么是守护线程？

守护线程（Daemon Thread）是为其他线程服务的线程。当所有非守护线程结束时，守护线程会自动退出。

打个比方：

> 守护线程就像**餐厅的服务员**——顾客（非守护线程）吃完饭走了，服务员就可以下班了。服务员的存在是为了服务顾客，顾客走了，服务员自然也不需要了。

### 使用守护线程

```java
public class DaemonDemo {
    public static void main(String[] args) {
        Thread daemon = new Thread(() -> {
            while (true) {
                System.out.println("守护线程运行中...");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    break;
                }
            }
        });

        // 必须在启动前设置为守护线程
        daemon.setDaemon(true);
        daemon.start();

        // 主线程（非守护线程）
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("主线程结束");
        // 主线程结束后，守护线程自动退出，JVM 退出
    }
}
```

::: warning 注意事项

1. `setDaemon(true)` 必须在 `start()` 之前调用
2. 守护线程中不要进行资源清理操作（如关闭文件、数据库连接）
3. 守护线程创建的子线程也是守护线程

:::

### 应用场景

- **垃圾回收器**：JVM 的 GC 线程就是守护线程
- **心跳检测**：定期检测服务是否可用
- **缓存清理**：定期清理过期缓存

---

## 8 死锁问题

### 什么是死锁？

死锁是指两个或多个线程互相持有对方需要的锁，导致所有线程都无法继续执行。

打个比方：

> 死锁就像**两个人过独木桥**——两个人在桥中间相遇，谁也不让谁，结果谁都过不了。

### 死锁示例

```java
public class DeadLockDemo {
    private static final Object lock1 = new Object();
    private static final Object lock2 = new Object();

    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            synchronized (lock1) {
                System.out.println("线程 1 持有 lock1");
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {}
                synchronized (lock2) {
                    System.out.println("线程 1 持有 lock2");
                }
            }
        });

        Thread t2 = new Thread(() -> {
            synchronized (lock2) {
                System.out.println("线程 2 持有 lock2");
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {}
                synchronized (lock1) {
                    System.out.println("线程 2 持有 lock1");
                }
            }
        });

        t1.start();
        t2.start();
        // 两个线程互相等待对方释放锁，形成死锁
    }
}
```

### 死锁的四个必要条件

1. **互斥条件**：资源一次只能被一个线程使用
2. **持有并等待**：线程持有资源的同时请求其他资源
3. **不可抢占**：资源只能由持有者主动释放
4. **循环等待**：多个线程形成环形等待链

### 避免死锁的方法

```java
// 方法 1：锁排序（按固定顺序获取锁）
public void safeMethod() {
    synchronized (lock1) {  // 总是先获取 lock1
        synchronized (lock2) {  // 再获取 lock2
            // 业务逻辑
        }
    }
}

// 方法 2：超时放弃（使用 tryLock）
ReentrantLock lockA = new ReentrantLock();
ReentrantLock lockB = new ReentrantLock();

public void tryLockMethod() {
    while (true) {
        if (lockA.tryLock()) {
            try {
                if (lockB.tryLock()) {
                    try {
                        // 业务逻辑
                        break;
                    } finally {
                        lockB.unlock();
                    }
                }
            } finally {
                lockA.unlock();
            }
        }
        // 获取失败，等待随机时间后重试
        Thread.sleep((long)(Math.random() * 100));
    }
}
```

### 检测死锁

使用 `jstack` 命令查看线程堆栈：

```bash
# 查看 Java 进程
jps

# 查看线程堆栈，如果有死锁会提示
jstack <pid>
```

---

## 9 读写锁 ReentrantReadWriteLock

### 读写锁的概念

读写锁将锁分为两种：
- **读锁（共享锁）**：多个线程可以同时持有
- **写锁（独占锁）**：同一时刻只能有一个线程持有

打个比方：

> 读写锁就像**图书馆**——多人可以同时看书（读锁共享），但一次只能有一个人修改书的内容（写锁独占）。

### 适用场景

读多写少的场景，如缓存、配置读取等。

### 代码示例

```java
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class CacheDemo {
    private final Map<String, Object> cache = new HashMap<>();
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final ReentrantReadWriteLock.ReadLock readLock = lock.readLock();
    private final ReentrantReadWriteLock.WriteLock writeLock = lock.writeLock();

    // 读操作：多个线程可以同时读取
    public Object get(String key) {
        readLock.lock();
        try {
            return cache.get(key);
        } finally {
            readLock.unlock();
        }
    }

    // 写操作：独占访问
    public void put(String key, Object value) {
        writeLock.lock();
        try {
            cache.put(key, value);
        } finally {
            writeLock.unlock();
        }
    }

    // 批量写入
    public void putAll(Map<String, Object> data) {
        writeLock.lock();
        try {
            cache.putAll(data);
        } finally {
            writeLock.unlock();
        }
    }
}
```

::: tip 性能优势

在 read 多 write 少的场景下，读写锁比 synchronized 性能更好，因为多个读线程可以并发执行，不需要互相等待。

:::

---

## 10 条件变量 Condition

### Condition 的作用

Condition 是 Lock 配合使用的条件变量，可以替代 `wait/notify/notifyAll`，提供更精确的线程控制。

### 基本用法

```java
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

public class BoundedBuffer {
    private final List<Integer> list = new ArrayList<>();
    private final int MAX_SIZE = 10;
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();  // 未满条件
    private final Condition notEmpty = lock.newCondition(); // 非空条件

    public void put(int value) throws InterruptedException {
        lock.lock();
        try {
            while (list.size() == MAX_SIZE) {
                notFull.await();  // 队列满，等待
            }
            list.add(value);
            notEmpty.signal();  // 唤醒消费者
        } finally {
            lock.unlock();
        }
    }

    public int take() throws InterruptedException {
        lock.lock();
        try {
            while (list.isEmpty()) {
                notEmpty.await();  // 队列空，等待
            }
            int value = list.remove(0);
            notFull.signal();  // 唤醒生产者
            return value;
        } finally {
            lock.unlock();
        }
    }
}
```

### 与 wait/notify 的对比

| 特性 | wait/notify | Condition |
|------|-------------|-----------|
| 配合使用 | synchronized | Lock |
| 条件数量 | 一个（所有线程等待同一个条件） | 多个（可以创建多个 Condition） |
| 灵活性 | 低 | 高 |
| 推荐程度 | 旧代码 | 新代码推荐 |

---

## 11 定时任务 ScheduledExecutorService

### 创建定时线程池

```java
import java.util.concurrent.*;

public class ScheduledDemo {
    public static void main(String[] args) {
        // 创建定时线程池
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

        // 1. 延迟执行：3 秒后执行一次
        scheduler.schedule(() -> {
            System.out.println("延迟任务执行");
        }, 3, TimeUnit.SECONDS);

        // 2. 固定频率执行：初始延迟 1 秒，之后每 2 秒执行一次
        scheduler.scheduleAtFixedRate(() -> {
            System.out.println("固定频率任务: " + System.currentTimeMillis());
        }, 1, 2, TimeUnit.SECONDS);

        // 3. 固定延迟执行：上次执行结束后延迟 2 秒再执行
        scheduler.scheduleWithFixedDelay(() -> {
            System.out.println("固定延迟任务: " + System.currentTimeMillis());
            try {
                Thread.sleep(1000);  // 模拟耗时
            } catch (InterruptedException e) {}
        }, 1, 2, TimeUnit.SECONDS);

        // 关闭调度器
        // scheduler.shutdown();
    }
}
```

### 两种执行方式的区别

- **scheduleAtFixedRate**：以固定频率执行，不管任务执行多长时间
- **scheduleWithFixedDelay**：上次执行结束后，延迟固定时间再执行

### 异常处理

```java
scheduler.scheduleAtFixedRate(() -> {
    try {
        // 业务逻辑
        System.out.println("执行任务");
        // 可能抛出异常
        int result = 1 / 0;
    } catch (Exception e) {
        // 必须捕获异常，否则任务会停止执行
        System.err.println("任务异常: " + e.getMessage());
    }
}, 0, 1, TimeUnit.SECONDS);
```

---

## 12 阻塞队列 BlockingQueue

### 阻塞队列的概念

阻塞队列是一种线程安全的数据结构，当队列为空时，获取元素的操作会阻塞；当队列满时，添加元素的操作会阻塞。

打个比方：

> 阻塞队列就像**自动售货机**——如果没货了，你会等待补货；如果满了，补货员会等待空间。

### 常用实现

```java
// 1. ArrayBlockingQueue：有界队列，必须指定容量
BlockingQueue<Integer> arrayQueue = new ArrayBlockingQueue<>(10);

// 2. LinkedBlockingQueue：可选有界队列
BlockingQueue<Integer> linkedQueue = new LinkedBlockingQueue<>();  // 无界
BlockingQueue<Integer> boundedQueue = new LinkedBlockingQueue<>(100);  // 有界

// 3. PriorityBlockingQueue：优先级队列
BlockingQueue<Integer> priorityQueue = new PriorityBlockingQueue<>();
```

### 核心方法

```java
BlockingQueue<String> queue = new ArrayBlockingQueue<>(3);

// 添加元素
queue.put("A");      // 队列满时阻塞
queue.offer("B");    // 队列满时返回 false
queue.offer("C", 1, TimeUnit.SECONDS);  // 超时返回 false

// 获取元素
String s1 = queue.take();  // 队列空时阻塞
String s2 = queue.poll();  // 队列空时返回 null
String s3 = queue.poll(1, TimeUnit.SECONDS);  // 超时返回 null

// 查看元素
String head = queue.peek();  // 查看队首元素，不删除
```

### 使用阻塞队列简化生产者消费者

```java
import java.util.concurrent.*;

public class SimpleProducerConsumer {
    public static void main(String[] args) {
        BlockingQueue<Integer> queue = new ArrayBlockingQueue<>(10);

        // 生产者
        new Thread(() -> {
            try {
                for (int i = 1; i <= 20; i++) {
                    queue.put(i);  // 队列满时自动阻塞
                    System.out.println("生产: " + i);
                    Thread.sleep(100);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();

        // 消费者
        new Thread(() -> {
            try {
                for (int i = 1; i <= 20; i++) {
                    int value = queue.take();  // 队列空时自动阻塞
                    System.out.println("消费: " + value);
                    Thread.sleep(150);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }
}
```

::: tip 优势

使用阻塞队列后，不需要手动编写 `wait/notify` 逻辑，队列会自动处理阻塞和唤醒。

:::

---

## 13 ThreadLocal 线程本地变量

### ThreadLocal 的作用

ThreadLocal 为每个线程提供独立的变量副本，线程之间互不影响。

打个比方：

> ThreadLocal 就像**每个人的水杯**——每个人都有自己的水杯，别人不能喝你杯子里的水。

### 基本用法

```java
public class ThreadLocalDemo {
    // 创建 ThreadLocal 变量
    private static ThreadLocal<String> threadLocal = new ThreadLocal<>();

    public static void main(String[] args) {
        // 线程 1
        new Thread(() -> {
            threadLocal.set("线程 1 的数据");
            System.out.println("线程 1: " + threadLocal.get());
            threadLocal.remove();  // 使用完毕后清理
        }).start();

        // 线程 2
        new Thread(() -> {
            threadLocal.set("线程 2 的数据");
            System.out.println("线程 2: " + threadLocal.get());
            threadLocal.remove();
        }).start();
    }
}
```

### 应用场景

```java
// 场景 1：数据库连接（每个线程有自己的连接）
public class DBUtil {
    private static ThreadLocal<Connection> connectionHolder = new ThreadLocal<>();

    public static Connection getConnection() {
        Connection conn = connectionHolder.get();
        if (conn == null) {
            conn = createConnection();
            connectionHolder.set(conn);
        }
        return conn;
    }
}

// 场景 2：用户 Session（Web 应用中保存当前用户信息）
public class UserContext {
    private static ThreadLocal<User> userHolder = new ThreadLocal<>();

    public static void setCurrentUser(User user) {
        userHolder.set(user);
    }

    public static User getCurrentUser() {
        return userHolder.get();
    }

    public static void removeCurrentUser() {
        userHolder.remove();
    }
}
```

### 内存泄漏问题

```java
// ❌ 错误：使用完毕后不清理
public void badMethod() {
    threadLocal.set("data");
    // 线程结束后，数据仍然占用内存
}

// ✅ 正确：使用 try-finally 清理
public void goodMethod() {
    try {
        threadLocal.set("data");
        // 业务逻辑
    } finally {
        threadLocal.remove();  // 必须清理
    }
}
```

::: warning 内存泄漏

在使用线程池时，线程会被复用。如果不清理 ThreadLocal，数据会一直存在，导致内存泄漏。务必在 `finally` 中调用 `remove()`。

:::

---

## 14 CompletableFuture 异步编程

### CompletableFuture 的优势

CompletableFuture 是 Java 8 引入的异步编程工具，可以方便地组合多个异步操作。

打个比方：

> CompletableFuture 就像**流水线**——每个步骤可以并行执行，前一步完成后自动触发下一步。

### 创建异步任务

```java
import java.util.concurrent.CompletableFuture;

public class AsyncDemo {
    public static void main(String[] args) {
        // 1. supplyAsync：有返回值
        CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {}
            return "Hello";
        });

        // 2. runAsync：无返回值
        CompletableFuture<Void> future2 = CompletableFuture.runAsync(() -> {
            System.out.println("异步任务");
        });

        // 获取结果
        try {
            String result = future1.get();  // 阻塞等待
            System.out.println(result);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 链式调用

```java
CompletableFuture.supplyAsync(() -> "Hello")
    .thenApply(s -> s + " World")  // 转换结果
    .thenApply(String::toUpperCase)  // 继续转换
    .thenAccept(System.out::println)  // 消费结果
    .thenRun(() -> System.out.println("完成"));  // 执行后续操作
```

### 组合多个异步操作

```java
// 1. thenCompose：串行组合（类似 flatMap）
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> "Hello");
CompletableFuture<String> future2 = future1.thenCompose(s ->
    CompletableFuture.supplyAsync(() -> s + " World")
);

// 2. thenCombine：并行组合（两个任务都完成后合并结果）
CompletableFuture<Integer> futureA = CompletableFuture.supplyAsync(() -> 10);
CompletableFuture<Integer> futureB = CompletableFuture.supplyAsync(() -> 20);
CompletableFuture<Integer> combined = futureA.thenCombine(futureB, (a, b) -> a + b);

// 3. allOf：等待所有任务完成
CompletableFuture<Void> all = CompletableFuture.allOf(future1, future2, futureA);

// 4. anyOf：任一任务完成
CompletableFuture<Object> any = CompletableFuture.anyOf(future1, future2, futureA);
```

### 异常处理

```java
CompletableFuture.supplyAsync(() -> {
    if (Math.random() > 0.5) {
        throw new RuntimeException("出错了");
    }
    return "成功";
})
.exceptionally(e -> "默认值")  // 异常时返回默认值
.handle((result, ex) -> {
    if (ex != null) {
        return "处理异常: " + ex.getMessage();
    }
    return result;
})
.whenComplete((result, ex) -> {
    // 无论成功失败都执行
    System.out.println("任务完成");
});
```

### 实际示例：异步数据获取

```java
public class UserDataService {
    public CompletableFuture<User> getUserInfo(long userId) {
        return CompletableFuture.supplyAsync(() -> {
            // 模拟网络请求
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {}
            return new User(userId, "张三");
        });
    }

    public CompletableFuture<List<Order>> getOrders(long userId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {}
            return Arrays.asList(new Order(1, 100.0), new Order(2, 200.0));
        });
    }

    // 组合使用：获取用户信息和订单
    public CompletableFuture<UserDetail> getUserDetail(long userId) {
        return getUserInfo(userId)
            .thenCombine(getOrders(userId), (user, orders) -> {
                return new UserDetail(user, orders);
            });
    }
}
```

---

## 15 Fork/Join 框架

### 分治思想

Fork/Join 框架用于并行执行分治任务。将大任务拆分成小任务，并行执行后合并结果。

打个比方：

> Fork/Join 就像**公司分任务**——老板把大项目拆成小任务，分配给多个员工并行执行，最后汇总结果。

### 基本用法

```java
import java.util.concurrent.RecursiveTask;
import java.util.concurrent.ForkJoinPool;

// 定义任务：计算 1 到 n 的和
class SumTask extends RecursiveTask<Long> {
    private final int[] array;
    private final int start;
    private final int end;
    private static final int THRESHOLD = 1000;  // 阈值

    SumTask(int[] array, int start, int end) {
        this.array = array;
        this.start = start;
        this.end = end;
    }

    @Override
    protected Long compute() {
        if (end - start <= THRESHOLD) {
            // 小任务：直接计算
            long sum = 0;
            for (int i = start; i < end; i++) {
                sum += array[i];
            }
            return sum;
        } else {
            // 大任务：拆分
            int mid = (start + end) / 2;
            SumTask left = new SumTask(array, start, mid);
            SumTask right = new SumTask(array, mid, end);
            left.fork();  // 异步执行左任务
            long rightResult = right.compute();  // 当前线程执行右任务
            long leftResult = left.join();  // 等待左任务完成
            return leftResult + rightResult;
        }
    }
}

// 使用
public class ForkJoinDemo {
    public static void main(String[] args) {
        int[] array = new int[10000];
        for (int i = 0; i < array.length; i++) {
            array[i] = i + 1;
        }

        ForkJoinPool pool = new ForkJoinPool();
        SumTask task = new SumTask(array, 0, array.length);
        Long result = pool.invoke(task);
        System.out.println("总和: " + result);
    }
}
```

### work-stealing 算法

Fork/Join 使用 work-stealing 算法：空闲线程会从忙碌线程的队列中"偷"任务执行，提高 CPU 利用率。

### 适用场景

- 大规模数据处理（如矩阵运算、图像处理）
- 递归问题（如归并排序、快速排序）
- 可以拆分成独立子任务的场景

---

## 16 新手常见误区

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

### 误区 6：ThreadLocal 不需要清理

**错！** 使用线程池时，ThreadLocal 不清理会导致内存泄漏。

```java
// ❌ 错误：使用完毕后不清理
public void badMethod() {
    threadLocal.set("data");
    // 线程结束后，数据仍然占用内存
}

// ✅ 正确：使用 try-finally 清理
public void goodMethod() {
    try {
        threadLocal.set("data");
        // 业务逻辑
    } finally {
        threadLocal.remove();  // 必须清理
    }
}
```

---

## 17 动手练习

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

### 练习 3：进阶练习 —— 使用阻塞队列简化生产者消费者

使用 ArrayBlockingQueue 实现生产者消费者模型，对比与 wait/notify 的区别。

<details>
<summary>点击查看答案</summary>

```java
import java.util.concurrent.*;

public class SimpleProducerConsumer {
    public static void main(String[] args) {
        BlockingQueue<Integer> queue = new ArrayBlockingQueue<>(10);

        // 生产者
        new Thread(() -> {
            try {
                for (int i = 1; i <= 20; i++) {
                    queue.put(i);  // 队列满时自动阻塞
                    System.out.println("生产: " + i);
                    Thread.sleep(100);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();

        // 消费者
        new Thread(() -> {
            try {
                for (int i = 1; i <= 20; i++) {
                    int value = queue.take();  // 队列空时自动阻塞
                    System.out.println("消费: " + value);
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

### 练习 4（挑战）：综合练习 —— 线程池任务调度

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

### 练习 5（挑战）：综合练习 —— CompletableFuture 异步编程

使用 CompletableFuture 实现异步数据获取：先获取用户信息，再获取用户订单，最后合并结果。

<details>
<summary>点击查看答案</summary>

```java
import java.util.concurrent.*;

public class AsyncDemo {
    // 模拟获取用户信息
    public static CompletableFuture<String> getUserInfo(long userId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {}
            return "用户" + userId;
        });
    }

    // 模拟获取订单列表
    public static CompletableFuture<String> getOrders(String userName) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Thread.sleep(300);
            } catch (InterruptedException e) {}
            return userName + " 的订单：订单1, 订单2";
        });
    }

    public static void main(String[] args) throws Exception {
        long startTime = System.currentTimeMillis();

        // 链式调用：先获取用户信息，再获取订单
        String result = getUserInfo(1001)
            .thenCompose(userName -> getOrders(userName))
            .get();  // 阻塞等待结果

        long endTime = System.currentTimeMillis();
        System.out.println("结果: " + result);
        System.out.println("总耗时: " + (endTime - startTime) + "ms");
        // 异步执行，总耗时约 800ms（而不是 800ms + 500ms）
    }
}
```

</details>

---

## 18 核心知识点

| 知识点       | 说明                                                   |
| ------------ | ------------------------------------------------------ |
| 创建线程     | 继承 Thread、实现 Runnable、实现 Callable              |
| 线程安全     | synchronized、Lock、原子类、volatile                   |
| 线程池       | FixedThreadPool、CachedThreadPool、ScheduledThreadPool |
| 同步工具     | CountDownLatch、CyclicBarrier、Semaphore               |
| 线程通信     | wait/notify/notifyAll、Condition                       |
| 线程安全集合 | ConcurrentHashMap、CopyOnWriteArrayList、BlockingQueue |
| 线程中断     | interrupt、isInterrupted、InterruptedException         |
| 守护线程     | setDaemon、自动退出                                    |
| 死锁         | 锁排序、tryLock、jstack 检测                           |
| 读写锁       | ReentrantReadWriteLock、读共享写独占                   |
| 定时任务     | ScheduledExecutorService、scheduleAtFixedRate          |
| ThreadLocal  | 线程隔离、内存泄漏                                     |
| 异步编程     | CompletableFuture、链式调用、组合操作                  |
| Fork/Join    | 分治思想、RecursiveTask、work-stealing                 |

---

## 下一章预告

下一章我们会学习 **Lambda 与 Stream API**——Java 8 引入的函数式编程特性。你会学到 Lambda 表达式、函数式接口、Stream 操作（filter、map、reduce）。学完这章，你就能写出更简洁、更优雅的代码了。
