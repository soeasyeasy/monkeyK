---
title: '第十三章：多线程与并发'
description: 'Thread、Runnable、线程池、synchronized、Lock'
---

# 第十三章：多线程与并发

## 创建线程

### 继承 Thread 类

```java
public class MyThread extends Thread {
    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + ": " + i);
        }
    }
}

MyThread t = new MyThread();
t.start();    // 启动线程，JVM 调用 run()
```

### 实现 Runnable 接口

```java
public class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("线程运行: " + Thread.currentThread().getName());
    }
}

Thread t = new Thread(new MyRunnable());
t.start();

// Lambda 写法
Thread t2 = new Thread(() -> {
    System.out.println("Lambda 线程");
});
t2.start();
```

### 实现 Callable 接口

```java
import java.util.concurrent.*;

Callable<Integer> task = () -> {
    int sum = 0;
    for (int i = 1; i <= 100; i++) {
        sum += i;
    }
    return sum;
};

FutureTask<Integer> futureTask = new FutureTask<>(task);
new Thread(futureTask).start();
Integer result = futureTask.get();    // 阻塞等待结果
System.out.println(result);           // 5050
```

## 线程生命周期

```
新建 → 就绪 → 运行 → 终止
              ↓↑
          阻塞（等待/睡眠/锁等待）
```

## 线程常用方法

```java
Thread t = new Thread(() -> {
    try {
        Thread.sleep(1000);    // 休眠 1 秒
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
});

t.start();
t.join();           // 等待该线程结束
t.setPriority(5);   // 设置优先级（1-10）
System.out.println(t.isAlive());  // 是否存活
```

## 线程安全

### synchronized

```java
public class Counter {
    private int count = 0;

    // 同步方法
    public synchronized void increment() {
        count++;
    }

    public int getCount() {
        return count;
    }
}

// 使用
Counter counter = new Counter();

// 多个线程同时调用 increment
for (int i = 0; i < 1000; i++) {
    new Thread(counter::increment).start();
}
```

### synchronized 代码块

```java
public class BankAccount {
    private double balance;
    private final Object lock = new Object();

    public void withdraw(double amount) {
        synchronized (lock) {
            if (balance >= amount) {
                balance -= amount;
                System.out.println("取款成功，余额: " + balance);
            }
        }
    }
}
```

## Lock 接口

```java
import java.util.concurrent.locks.*;

public class SafeCounter {
    private int count = 0;
    private final Lock lock = new ReentrantLock();

    public void increment() {
        lock.lock();
        try {
            count++;
        } finally {
            lock.unlock();    // 必须在 finally 中释放锁
        }
    }
}
```

## 线程池

```java
import java.util.concurrent.*;

// 创建固定大小的线程池
ExecutorService pool = Executors.newFixedThreadPool(5);

// 提交任务
for (int i = 0; i < 10; i++) {
    pool.submit(() -> {
        System.out.println("线程: " + Thread.currentThread().getName());
    });
}

// 关闭线程池
pool.shutdown();
```

### 自定义线程池

```java
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    2,                      // 核心线程数
    5,                      // 最大线程数
    60, TimeUnit.SECONDS,   // 空闲线程存活时间
    new LinkedBlockingQueue<>(100),  // 任务队列
    Executors.defaultThreadFactory(),
    new ThreadPoolExecutor.CallerRunsPolicy()  // 拒绝策略
);

pool.execute(() -> {
    System.out.println("任务执行");
});

pool.shutdown();
```

## 线程间通信

```java
public class ProducerConsumer {
    private final List<Integer> list = new ArrayList<>();
    private final int MAX = 10;

    public synchronized void produce() throws InterruptedException {
        while (list.size() == MAX) {
            wait();    // 满了就等待
        }
        list.add(1);
        System.out.println("生产，当前数量: " + list.size());
        notifyAll();   // 唤醒消费者
    }

    public synchronized void consume() throws InterruptedException {
        while (list.isEmpty()) {
            wait();    // 空了就等待
        }
        list.remove(0);
        System.out.println("消费，当前数量: " + list.size());
        notifyAll();   // 唤醒生产者
    }
}
```

## 线程安全集合

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

## 原子类

### AtomicInteger

```java
import java.util.concurrent.atomic.AtomicInteger;

AtomicInteger counter = new AtomicInteger(0);

// 原子操作
counter.incrementAndGet();  // +1 并返回
counter.decrementAndGet();  // -1 并返回
counter.addAndGet(10);      // +10 并返回
counter.compareAndSet(10, 20);  // CAS 操作

// 线程安全，无需同步
for (int i = 0; i < 1000; i++) {
    new Thread(() -> counter.incrementAndGet()).start();
}
```

### AtomicReference

```java
import java.util.concurrent.atomic.AtomicReference;

AtomicReference<String> ref = new AtomicReference<>("Hello");

// 原子更新
ref.set("World");
String oldValue = ref.getAndSet("Java");  // 返回旧值
boolean success = ref.compareAndSet("Java", "Python");  // CAS
```

## volatile 关键字

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

## 线程池类型

### FixedThreadPool

```java
// 固定大小线程池
ExecutorService fixed = Executors.newFixedThreadPool(5);

for (int i = 0; i < 10; i++) {
    fixed.submit(() -> {
        System.out.println("线程: " + Thread.currentThread().getName());
    });
}

fixed.shutdown();
```

### CachedThreadPool

```java
// 缓存线程池（根据需要创建新线程）
ExecutorService cached = Executors.newCachedThreadPool();

for (int i = 0; i < 100; i++) {
    cached.submit(() -> {
        System.out.println("线程: " + Thread.currentThread().getName());
    });
}

cached.shutdown();
```

### ScheduledThreadPool

```java
// 定时任务线程池
ScheduledExecutorService scheduled = Executors.newScheduledThreadPool(2);

// 延迟 3 秒执行
scheduled.schedule(() -> {
    System.out.println("延迟执行");
}, 3, TimeUnit.SECONDS);

// 固定频率执行（每 2 秒执行一次）
scheduled.scheduleAtFixedRate(() -> {
    System.out.println("固定频率: " + System.currentTimeMillis());
}, 0, 2, TimeUnit.SECONDS);

// 固定延迟执行（上次执行结束后 2 秒再执行）
scheduled.scheduleWithFixedDelay(() -> {
    System.out.println("固定延迟: " + System.currentTimeMillis());
}, 0, 2, TimeUnit.SECONDS);
```

## CountDownLatch

```java
import java.util.concurrent.CountDownLatch;

public class Race {
    public static void main(String[] args) throws InterruptedException {
        int runnerCount = 5;
        CountDownLatch startSignal = new CountDownLatch(1);
        CountDownLatch doneSignal = new CountDownLatch(runnerCount);

        // 创建运动员
        for (int i = 0; i < runnerCount; i++) {
            new Thread(() -> {
                try {
                    startSignal.await();  // 等待起跑信号
                    System.out.println(Thread.currentThread().getName() + " 起跑");
                    Thread.sleep((long)(Math.random() * 1000));
                    System.out.println(Thread.currentThread().getName() + " 到达终点");
                    doneSignal.countDown();  // 完成比赛
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

## CyclicBarrier

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

## Semaphore

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
                    semaphore.acquire();  // 获取停车位
                    System.out.println(carName + " 停车");
                    Thread.sleep(2000);  // 停车 2 秒
                    System.out.println(carName + " 离开");
                    semaphore.release();  // 释放停车位
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }).start();
        }
    }
}
```

## CompletableFuture

```java
import java.util.concurrent.CompletableFuture;

// 异步任务
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    try {
        Thread.sleep(1000);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    return "任务完成";
});

// 处理结果
future.thenAccept(result -> System.out.println("结果: " + result));

// 链式调用
CompletableFuture.supplyAsync(() -> "Hello")
    .thenApply(s -> s + " World")
    .thenApply(String::toUpperCase)
    .thenAccept(System.out::println);

// 组合多个任务
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> "任务1");
CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> "任务2");

CompletableFuture.allOf(future1, future2)
    .thenRun(() -> System.out.println("所有任务完成"));

// 等待结果
String result = future.join();  // 阻塞等待
```

## 死锁示例

```java
public class DeadLock {
    private static final Object lock1 = new Object();
    private static final Object lock2 = new Object();

    public static void main(String[] args) {
        new Thread(() -> {
            synchronized (lock1) {
                System.out.println("线程1持有lock1");
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                synchronized (lock2) {
                    System.out.println("线程1获取lock2");
                }
            }
        }).start();

        new Thread(() -> {
            synchronized (lock2) {
                System.out.println("线程2持有lock2");
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                synchronized (lock1) {
                    System.out.println("线程2获取lock1");
                }
            }
        }).start();
    }
}
// 可能导致死锁：两个线程互相等待对方释放锁
```

## 线程状态转换

```
NEW（新建）
  ↓ start()
RUNNABLE（就绪/运行）
  ↓ 调用 sleep()/wait()/join() 或等待锁
BLOCKED/WAITING（阻塞/等待）
  ↓ 条件满足
RUNNABLE（重新进入就绪状态）
  ↓ run() 方法执行完毕
TERMINATED（终止）
```

## 核心知识点

1. **创建线程**：继承 Thread、实现 Runnable、实现 Callable
2. **线程安全**：synchronized、Lock、原子类、volatile
3. **线程池**：FixedThreadPool、CachedThreadPool、ScheduledThreadPool
4. **同步工具**：CountDownLatch、CyclicBarrier、Semaphore
5. **异步编程**：CompletableFuture 链式调用
6. **线程通信**：wait/notify/notifyAll
7. **死锁**：避免多个锁的嵌套持有

## 本章小结

Java 多线程可通过继承 Thread、实现 Runnable 或 Callable 创建。synchronized 和 Lock 保证线程安全。线程池提高线程复用效率。wait/notify 实现线程间通信。实际开发中要注意死锁问题和线程安全。接下来我们将学习 Lambda 与 Stream API。
