---
title: "第八章：并发编程原理"
description: "线程模型、内存可见性、synchronized 锁升级、AQS 框架"
---

# 第八章：并发编程原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 线程到底是什么？操作系统线程和 Java 线程有什么关系？
- 为什么多线程会出现可见性问题？Java 内存模型是怎么工作的？
- volatile 是怎么保证可见性的？内存屏障是什么？
- synchronized 的锁升级是怎么发生的？偏向锁、轻量级锁、重量级锁有什么区别？
- AQS 框架是什么？ReentrantLock 是怎么实现的？
- 线程池的核心参数和工作流程是怎样的？

这一章就是为了解答这些问题。我们会从线程的本质出发，深入到 Java 内存模型，再学习各种并发工具的底层原理，最后掌握线程池的工作机制。

学完本章，你将能够：
- 理解线程的本质和 Java 线程模型
- 掌握 Java 内存模型（JMM）的核心概念
- 理解 volatile 和 synchronized 的底层实现
- 了解锁升级机制和 AQS 框架
- 掌握线程池的原理和使用

---

## 1 为什么需要并发编程？

### 痛点分析

想象一下这个场景：

你需要处理 1000 个用户的请求，如果单线程处理：

```java
// 单线程处理 - 串行执行
public void handleRequests(List<Request> requests) {
    for (Request request : requests) {
        processRequest(request);  // 每个请求耗时 10ms
    }
}

// 总耗时：1000 * 10ms = 10000ms = 10秒
```

**问题很明显**：
- 单线程无法充分利用多核 CPU
- 响应时间长，用户体验差
- 系统吞吐量低

### 解决方案：并发编程

使用多线程并发处理：

```java
// 多线程处理 - 并发执行
public void handleRequests(List<Request> requests) {
    ExecutorService executor = Executors.newFixedThreadPool(10);
    
    for (Request request : requests) {
        executor.submit(() -> processRequest(request));
    }
    
    executor.shutdown();
}

// 总耗时：1000 * 10ms / 10 = 1000ms = 1秒（理想情况）
```

> **一句话总结**：并发编程可以充分利用多核 CPU，提高系统响应速度和吞吐量。

---

## 2 核心原理：线程的本质

### 操作系统线程 vs Java 线程

```java
// 创建线程
Thread thread = new Thread(() -> {
    System.out.println("线程运行: " + Thread.currentThread().getName());
});
thread.start();

// 底层实现
// Java 线程（JDK 1.2 之后）直接映射到操作系统原生线程
// Windows: Windows Thread
// Linux: pthread (POSIX Thread)
```

### 线程的状态

```java
// 线程的 6 种状态
public enum State {
    NEW,           // 新建（未启动）
    RUNNABLE,      // 可运行（包括就绪和运行中）
    BLOCKED,       // 阻塞（等待获取锁）
    WAITING,       // 无限期等待（wait/join/park）
    TIMED_WAITING, // 限期等待（sleep/wait(timeout)/join(timeout)）
    TERMINATED     // 终止（执行完成）
}

// 状态转换
// NEW → RUNNABLE（调用 start()）
// RUNNABLE → BLOCKED（等待获取 synchronized 锁）
// RUNNABLE → WAITING（调用 wait/join/park）
// WAITING → RUNNABLE（被唤醒）
// RUNNABLE → TIMED_WAITING（调用 sleep/wait(timeout)）
// TIMED_WAITING → RUNNABLE（超时或被唤醒）
// RUNNABLE → TERMINATED（执行完成）
```

### 线程的创建方式

```java
// 方式 1：继承 Thread 类
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("线程运行");
    }
}
new MyThread().start();

// 方式 2：实现 Runnable 接口
class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("线程运行");
    }
}
new Thread(new MyRunnable()).start();

// 方式 3：实现 Callable 接口（可以返回值）
class MyCallable implements Callable<String> {
    @Override
    public String call() throws Exception {
        return "结果";
    }
}
FutureTask<String> future = new FutureTask<>(new MyCallable());
new Thread(future).start();
String result = future.get();  // 获取返回值

// 方式 4：线程池（推荐）
ExecutorService executor = Executors.newFixedThreadPool(5);
executor.submit(() -> System.out.println("线程运行"));
```

---

## 3 Java 内存模型（JMM）

### 主内存与工作内存

```java
// JMM 的抽象结构
// 主内存（共享）
//   ↓
// 工作内存（线程私有）
//   ↓
// 线程执行引擎

// 每个线程都有自己的工作内存
// 对变量的操作必须在工作内存中进行，不能直接操作主内存
```

### 可见性问题

```java
// 可见性问题示例
public class VisibilityDemo {
    
    private static boolean flag = false;
    
    public static void main(String[] args) throws InterruptedException {
        // 线程 1：修改 flag
        new Thread(() -> {
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            flag = true;
            System.out.println("线程 1：flag = " + flag);
        }).start();
        
        // 线程 2：读取 flag
        new Thread(() -> {
            while (!flag) {
                // 死循环
                // 问题：线程 2 可能永远看不到 flag 的变化
            }
            System.out.println("线程 2：检测到 flag 变化");
        }).start();
    }
}

// 问题原因：
// 线程 2 的工作内存中缓存了 flag 的旧值
// 没有及时从主内存读取最新值
```

### 解决方案：volatile

```java
// 使用 volatile 保证可见性
public class VisibilityDemo {
    
    // volatile 关键字
    private static volatile boolean flag = false;
    
    public static void main(String[] args) throws InterruptedException {
        new Thread(() -> {
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            flag = true;
            System.out.println("线程 1：flag = " + flag);
        }).start();
        
        new Thread(() -> {
            while (!flag) {
                // 现在可以检测到 flag 的变化
            }
            System.out.println("线程 2：检测到 flag 变化");
        }).start();
    }
}
```

### happens-before 原则

```java
// happens-before 规则：
// 如果操作 A happens-before 操作 B，那么 A 的结果对 B 可见

// 规则 1：程序顺序规则
// 同一个线程中，前面的操作 happens-before 后面的操作
int x = 1;      // 操作 A
int y = 2;      // 操作 B（A happens-before B）

// 规则 2：volatile 变量规则
// 对 volatile 变量的写 happens-before 对它的读
volatile int count = 0;
count = 1;      // 写操作
int value = count;  // 读操作（可以看到写操作的结果）

// 规则 3：传递性
// 如果 A happens-before B，B happens-before C，那么 A happens-before C

// 规则 4：线程启动规则
// Thread.start() happens-before 线程中的任何操作
Thread thread = new Thread(() -> {
    // 可以看到 start() 之前的所有操作
});
thread.start();

// 规则 5：线程终止规则
// 线程中的所有操作 happens-before Thread.join()
thread.join();  // 可以看到线程中的所有操作

// 规则 6：锁规则
// 解锁 happens-before 加锁
synchronized (lock) {
    // 可以看到之前释放锁时的所有操作
}
```

---

## 4 volatile 原理

### 内存屏障

```java
// volatile 的底层实现：内存屏障
// 内存屏障（Memory Barrier）是一种 CPU 指令
// 用于禁止特定类型的内存操作重排序

// volatile 写的内存屏障：
// StoreStore Barrier → 写操作 → StoreLoad Barrier

// volatile 读的内存屏障：
// LoadLoad Barrier → 读操作 → LoadStore Barrier

// 内存屏障的作用：
// 1. 保证可见性（强制刷新到主内存）
// 2. 禁止指令重排序
```

### 禁止指令重排序

```java
// 指令重排序示例
public class ReorderDemo {
    
    private static int x = 0;
    private static int y = 0;
    private static volatile boolean flag = false;
    
    public static void main(String[] args) {
        // 线程 1
        new Thread(() -> {
            x = 1;           // 操作 A
            flag = true;     // 操作 B（volatile 写）
        }).start();
        
        // 线程 2
        new Thread(() -> {
            if (flag) {      // 操作 C（volatile 读）
                System.out.println("x = " + y);  // 操作 D
            }
        }).start();
        
        // 如果没有 volatile，A 和 B 可能重排序
        // 导致线程 2 看到 flag=true 时，x 还是 0
    }
}

// volatile 保证：
// 操作 A happens-before 操作 B（volatile 写）
// 操作 C happens-before 操作 D（volatile 读）
// 因此，操作 A happens-before 操作 D
```

### volatile 不保证原子性

```java
// volatile 不保证原子性
public class AtomicityDemo {
    
    private static volatile int count = 0;
    
    public static void main(String[] args) throws InterruptedException {
        int threadCount = 10;
        Thread[] threads = new Thread[threadCount];
        
        for (int i = 0; i < threadCount; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 1000; j++) {
                    count++;  // 不是原子操作！
                }
            });
            threads[i].start();
        }
        
        for (Thread thread : threads) {
            thread.join();
        }
        
        System.out.println("count = " + count);  // 小于 10000
    }
}

// count++ 实际上是三个操作：
// 1. 读取 count 的值
// 2. 加 1
// 3. 写回 count 的值

// 解决方案：使用 AtomicInteger
private static AtomicInteger count = new AtomicInteger(0);
// count.incrementAndGet();  // 原子操作
```

---

## 5 synchronized 锁升级

### 锁的四种状态

```
无锁 → 偏向锁 → 轻量级锁 → 重量级锁
```

### 偏向锁

```java
// 偏向锁：适用于只有一个线程访问的场景
// 对象头中记录线程 ID，下次同一个线程访问时直接获取锁

// 对象头的 Mark Word（64 位 JVM）：
// | 无锁 | 对象哈希码 | 分代年龄 | 0 | 01 |
// | 偏向锁 | 线程 ID | 时间戳 | 分代年龄 | 1 | 01 |
// | 轻量级锁 | 指向栈中锁记录的指针 | 00 |
// | 重量级锁 | 指向堆中 monitor 的指针 | 10 |

// 偏向锁的获取过程：
// 1. 检查 Mark Word 中的线程 ID 是否是当前线程
// 2. 如果是，直接获取锁
// 3. 如果不是，撤销偏向锁，升级为轻量级锁

// 偏向锁的撤销时机：
// - 有其他线程访问
// - 调用对象的 hashCode() 方法
// - 调用 wait()/notify() 方法
```

### 轻量级锁

```java
// 轻量级锁：适用于线程交替访问的场景
// 使用 CAS 操作获取锁

// 轻量级锁的获取过程：
// 1. 在栈帧中创建 Lock Record
// 2. 使用 CAS 将对象头的 Mark Word 替换为指向 Lock Record 的指针
// 3. 如果 CAS 成功，获取锁
// 4. 如果失败，自旋等待（重试几次）
// 5. 如果自旋失败，升级为重量级锁

// 轻量级锁的释放：
// 使用 CAS 将 Mark Word 恢复为原来的值
```

### 重量级锁

```java
// 重量级锁：适用于多线程竞争激烈的场景
// 依赖操作系统的 Mutex Lock

// 重量级锁的获取过程：
// 1. 获取锁失败，线程进入阻塞状态
// 2. 操作系统切换线程状态（用户态 → 内核态）
// 3. 线程阻塞，等待唤醒
// 4. 被唤醒后重新竞争锁

// 重量级锁的开销：
// - 线程切换需要用户态和内核态的转换
// - 阻塞和唤醒需要操作系统的参与
// - 性能开销较大
```

### synchronized 的使用方式

```java
// 方式 1：实例方法（锁当前对象）
public synchronized void method() {
    // 锁的是 this 对象
}

// 方式 2：静态方法（锁 Class 对象）
public static synchronized void method() {
    // 锁的是 MyClass.class 对象
}

// 方式 3：代码块（锁指定对象）
public void method() {
    synchronized (this) {
        // 锁的是 this 对象
    }
    
    synchronized (MyClass.class) {
        // 锁的是 MyClass.class 对象
    }
    
    Object lock = new Object();
    synchronized (lock) {
        // 锁的是 lock 对象
    }
}
```

---

## 6 AQS 框架原理

### 什么是 AQS

```java
// AQS（AbstractQueuedSynchronizer）是 Java 并发包的核心框架
// 很多同步工具都基于 AQS 实现：
// - ReentrantLock
// - CountDownLatch
// - Semaphore
// - CyclicBarrier（部分）

// AQS 的核心思想：
// 1. 使用 volatile int state 表示同步状态
// 2. 使用 FIFO 队列管理等待线程
// 3. 提供模板方法，子类实现获取/释放锁的逻辑
```

### AQS 的核心结构

```java
public abstract class AbstractQueuedSynchronizer extends AbstractOwnableSynchronizer {
    
    // 同步状态
    private volatile int state;
    
    // 等待队列（CLH 队列的变体）
    private transient volatile Node head;
    private transient volatile Node tail;
    
    // 节点类
    static final class Node {
        // 等待状态
        static final int CANCELLED = 1;
        static final int SIGNAL = -1;
        static final int CONDITION = -2;
        static final int PROPAGATE = -3;
        
        volatile int waitStatus;
        volatile Node prev;
        volatile Node next;
        volatile Thread thread;
        Node nextWaiter;
    }
    
    // 获取 state
    protected final int getState() {
        return state;
    }
    
    // 设置 state
    protected final void setState(int newState) {
        state = newState;
    }
    
    // CAS 修改 state
    protected final boolean compareAndSetState(int expect, int update) {
        return unsafe.compareAndSwapInt(this, stateOffset, expect, update);
    }
    
    // 子类需要实现的方法
    protected boolean tryAcquire(int arg) {
        throw new UnsupportedOperationException();
    }
    
    protected boolean tryRelease(int arg) {
        throw new UnsupportedOperationException();
    }
}
```

### ReentrantLock 的实现

```java
public class ReentrantLock implements Lock {
    
    // 内部同步器
    private final Sync sync;
    
    // 抽象同步器
    abstract static class Sync extends AbstractQueuedSynchronizer {
        // 子类需要实现 tryAcquire 和 tryRelease
    }
    
    // 公平锁
    static final class FairSync extends Sync {
        @Override
        protected boolean tryAcquire(int acquires) {
            final Thread current = Thread.currentThread();
            int c = getState();
            
            if (c == 0) {
                // 如果没有线程持有锁
                if (!hasQueuedPredecessors()) {
                    // 如果队列中没有等待的线程，尝试获取锁
                    if (compareAndSetState(0, acquires)) {
                        setExclusiveOwnerThread(current);
                        return true;
                    }
                }
            } else if (current == getExclusiveOwnerThread()) {
                // 如果当前线程已经持有锁（可重入）
                int nextc = c + acquires;
                setState(nextc);
                return true;
            }
            
            return false;
        }
    }
    
    // 非公平锁
    static final class NonfairSync extends Sync {
        @Override
        protected boolean tryAcquire(int acquires) {
            return nonfairTryAcquire(acquires);
        }
        
        final boolean nonfairTryAcquire(int acquires) {
            final Thread current = Thread.currentThread();
            int c = getState();
            
            if (c == 0) {
                // 直接尝试获取锁（不检查队列）
                if (compareAndSetState(0, acquires)) {
                    setExclusiveOwnerThread(current);
                    return true;
                }
            } else if (current == getExclusiveOwnerThread()) {
                // 可重入
                int nextc = c + acquires;
                setState(nextc);
                return true;
            }
            
            return false;
        }
    }
    
    // 获取锁
    public void lock() {
        sync.acquire(1);
    }
    
    // 释放锁
    public void unlock() {
        sync.release(1);
    }
}
```

> **生活化类比**：
> AQS 就像"银行排队系统"：
> - state 表示窗口是否空闲
> - 队列是等待的客户
> - tryAcquire 是尝试获取服务
> - 获取失败就排队等待
> - 被唤醒后重新尝试获取

---

## 7 线程池原理

### 核心参数

```java
public ThreadPoolExecutor(
    int corePoolSize,        // 核心线程数
    int maximumPoolSize,     // 最大线程数
    long keepAliveTime,      // 空闲线程存活时间
    TimeUnit unit,           // 时间单位
    BlockingQueue<Runnable> workQueue,  // 任务队列
    ThreadFactory threadFactory,        // 线程工厂
    RejectedExecutionHandler handler    // 拒绝策略
)
```

### 工作流程

```java
// 线程池的工作流程
public void execute(Runnable command) {
    // 1. 如果当前线程数 < corePoolSize，创建核心线程
    if (workerCountOf(ctl) < corePoolSize) {
        if (addWorker(command, true)) {
            return;
        }
    }
    
    // 2. 如果核心线程满了，将任务放入队列
    if (workQueue.offer(command)) {
        // 入队成功
    } else {
        // 3. 如果队列也满了，创建非核心线程
        if (!addWorker(command, false)) {
            // 4. 如果达到 maximumPoolSize，执行拒绝策略
            reject(command);
        }
    }
}
```

### 拒绝策略

```java
// 4 种内置拒绝策略
// 1. AbortPolicy（默认）：抛出异常
throw new RejectedExecutionException();

// 2. CallerRunsPolicy：调用者线程执行
public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
    r.run();  // 直接在调用者线程执行
}

// 3. DiscardPolicy：丢弃任务
public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
    // 什么都不做
}

// 4. DiscardOldestPolicy：丢弃最老的任务
public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
    workQueue.poll();  // 移除队列头部的任务
    workQueue.offer(r);  // 重新尝试入队
}
```

### 常用线程池

```java
// 1. 固定大小线程池
ExecutorService fixedPool = Executors.newFixedThreadPool(5);
// corePoolSize = maximumPoolSize = 5
// workQueue = LinkedBlockingQueue（无界队列）

// 2. 缓存线程池
ExecutorService cachedPool = Executors.newCachedThreadPool();
// corePoolSize = 0，maximumPoolSize = Integer.MAX_VALUE
// keepAliveTime = 60 秒
// workQueue = SynchronousQueue（同步队列）

// 3. 单线程池
ExecutorService singlePool = Executors.newSingleThreadExecutor();
// corePoolSize = maximumPoolSize = 1
// workQueue = LinkedBlockingQueue（无界队列）

// 4. 定时线程池
ScheduledExecutorService scheduledPool = Executors.newScheduledThreadPool(5);
// 支持定时和周期性任务
```

> **生产建议**：不推荐使用 Executors 创建线程池，建议直接使用 ThreadPoolExecutor，避免资源耗尽的风险。

---

## 8 核心知识点总结

### 并发工具对比

| 工具 | 原理 | 特点 | 适用场景 |
|------|------|------|----------|
| volatile | 内存屏障 | 保证可见性，不保证原子性 | 状态标志 |
| synchronized | 锁升级 | 可重入，自动释放 | 简单同步 |
| ReentrantLock | AQS | 可中断，可超时，公平/非公平 | 复杂同步 |
| AtomicInteger | CAS | 无锁，高性能 | 原子操作 |
| ThreadLocal | 线程本地变量 | 线程隔离 | 线程上下文 |

### 锁对比

| 特性 | synchronized | ReentrantLock |
|------|-------------|---------------|
| 实现方式 | JVM 内置 | JDK 实现（AQS） |
| 锁释放 | 自动释放 | 手动释放（finally） |
| 可中断 | 不可中断 | 可中断（lockInterruptibly） |
| 超时获取 | 不支持 | 支持（tryLock） |
| 公平锁 | 非公平 | 可选公平/非公平 |
| 条件变量 | 一个（wait/notify） | 多个（Condition） |
| 性能 | 优化后接近 | 略高 |

---

## 9 新手常见误区

### 误区 1："volatile 可以替代 synchronized"

**错！** volatile 只保证可见性，不保证原子性：

```java
// ❌ 错误：用 volatile 实现线程安全
private volatile int count = 0;

public void increment() {
    count++;  // 不是原子操作！
}

// ✅ 正确：使用 AtomicInteger 或 synchronized
private AtomicInteger count = new AtomicInteger(0);
public void increment() {
    count.incrementAndGet();  // 原子操作
}
```

### 误区 2："线程池越大越好"

**错！** 线程池大小需要根据场景设置：

```java
// ❌ 错误：线程池设置过大
ExecutorService pool = Executors.newFixedThreadPool(1000);
// 线程过多会导致：
// - 内存溢出（每个线程占用约 1MB 栈空间）
// - 频繁线程切换，性能下降

// ✅ 正确：根据任务类型设置
// CPU 密集型：corePoolSize = CPU 核心数 + 1
int cpuCores = Runtime.getRuntime().availableProcessors();
ExecutorService cpuPool = Executors.newFixedThreadPool(cpuCores + 1);

// IO 密集型：corePoolSize = CPU 核心数 * 2 或更多
ExecutorService ioPool = Executors.newFixedThreadPool(cpuCores * 2);
```

### 误区 3："synchronized 锁的是方法或代码块"

**错！** synchronized 锁的是对象：

```java
// ❌ 错误理解
public synchronized void method() {
    // 以为锁的是方法
}

// ✅ 正确理解
public synchronized void method() {
    // 锁的是 this 对象
}

// 等价于
public void method() {
    synchronized (this) {
        // 锁的是 this 对象
    }
}

// 静态方法锁的是 Class 对象
public static synchronized void method() {
    // 锁的是 MyClass.class 对象
}
```

### 误区 4："线程安全就是完全不用考虑并发"

**错！** 线程安全需要正确使用同步工具：

```java
// ❌ 错误：以为用了线程安全的类就万事大吉
public class Counter {
    private AtomicInteger count = new AtomicInteger(0);
    
    public void increment() {
        count.incrementAndGet();  // 原子操作
    }
    
    public int getCount() {
        return count.get();
    }
    
    public void checkAndIncrement() {
        if (count.get() < 100) {  // 检查
            count.incrementAndGet();  // 操作
            // 问题：检查和操作之间不是原子的！
        }
    }
}

// ✅ 正确：使用 CAS 循环
public void checkAndIncrement() {
    while (true) {
        int current = count.get();
        if (current >= 100) {
            break;
        }
        if (count.compareAndSet(current, current + 1)) {
            break;
        }
    }
}
```

### 误区 5："ThreadLocal 是线程安全的，可以随便用"

**错！** ThreadLocal 使用不当会导致内存泄漏：

```java
// ❌ 错误：没有 remove
ThreadLocal<User> userHolder = new ThreadLocal<>();

public void process(User user) {
    userHolder.set(user);
    // 业务逻辑...
    // 忘记 remove，线程池中的线程会一直持有 user 对象
}

// ✅ 正确：使用 try-finally 确保 remove
public void process(User user) {
    userHolder.set(user);
    try {
        // 业务逻辑...
    } finally {
        userHolder.remove();  // 必须 remove
    }
}
```

---

## 10 动手练习

### 练习 1：基础题

请回答以下问题：

1. Java 内存模型（JMM）解决了什么问题？
2. volatile 和 synchronized 的区别是什么？
3. 线程池的核心参数有哪些？工作流程是怎样的？

<details>
<summary>点击查看答案</summary>

1. **JMM 解决的问题**：
   - 可见性问题：线程对共享变量的修改，其他线程能否及时看到
   - 有序性问题：指令重排序可能导致意外结果
   - 原子性问题：复合操作是否不可分割

2. **volatile 和 synchronized 的区别**：
   - volatile：保证可见性，禁止指令重排，不保证原子性，轻量级
   - synchronized：保证可见性、有序性、原子性，重量级，会阻塞

3. **线程池的核心参数和工作流程**：
   - 核心参数：corePoolSize、maximumPoolSize、keepAliveTime、workQueue、handler
   - 工作流程：
     1. 线程数 < corePoolSize → 创建核心线程
     2. 核心线程满 → 任务入队
     3. 队列满 → 创建非核心线程
     4. 达到 maximumPoolSize → 执行拒绝策略

</details>

### 练习 2：进阶题

请实现一个简单的生产者-消费者模型，使用 ReentrantLock 和 Condition 实现。

<details>
<summary>点击查看答案</summary>

```java
import java.util.LinkedList;
import java.util.Queue;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

public class ProducerConsumerDemo {
    
    private final Queue<Integer> queue = new LinkedList<>();
    private final int capacity;
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();
    
    public ProducerConsumerDemo(int capacity) {
        this.capacity = capacity;
    }
    
    public void produce(int item) throws InterruptedException {
        lock.lock();
        try {
            // 队列满时等待
            while (queue.size() == capacity) {
                notFull.await();
            }
            
            queue.offer(item);
            System.out.println("生产: " + item + ", 队列大小: " + queue.size());
            
            // 唤醒消费者
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }
    
    public int consume() throws InterruptedException {
        lock.lock();
        try {
            // 队列空时等待
            while (queue.isEmpty()) {
                notEmpty.await();
            }
            
            int item = queue.poll();
            System.out.println("消费: " + item + ", 队列大小: " + queue.size());
            
            // 唤醒生产者
            notFull.signal();
            
            return item;
        } finally {
            lock.unlock();
        }
    }
    
    public static void main(String[] args) {
        ProducerConsumerDemo demo = new ProducerConsumerDemo(5);
        
        // 生产者线程
        Thread producer = new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                try {
                    demo.produce(i);
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
        
        // 消费者线程
        Thread consumer = new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                try {
                    demo.consume();
                    Thread.sleep(200);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
        
        producer.start();
        consumer.start();
    }
}
```

</details>

### 练习 3（挑战）：综合题

请实现一个简单的线程池，支持提交任务、核心线程数、最大线程数、任务队列。

<details>
<summary>点击查看答案</summary>

```java
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

public class SimpleThreadPool {
    
    private final int corePoolSize;
    private final int maximumPoolSize;
    private final BlockingQueue<Runnable> workQueue;
    private final Set<Worker> workers;
    private final AtomicInteger threadCount = new AtomicInteger(0);
    private volatile boolean shutdown = false;
    
    public SimpleThreadPool(int corePoolSize, int maximumPoolSize, int queueCapacity) {
        this.corePoolSize = corePoolSize;
        this.maximumPoolSize = maximumPoolSize;
        this.workQueue = new LinkedBlockingQueue<>(queueCapacity);
        this.workers = new HashSet<>();
    }
    
    public void execute(Runnable task) {
        if (shutdown) {
            throw new IllegalStateException("ThreadPool is shutdown");
        }
        
        int count = threadCount.get();
        
        // 1. 如果当前线程数 < corePoolSize，创建核心线程
        if (count < corePoolSize) {
            addWorker(task, true);
            return;
        }
        
        // 2. 尝试将任务放入队列
        if (workQueue.offer(task)) {
            return;
        }
        
        // 3. 队列满了，尝试创建非核心线程
        if (count < maximumPoolSize) {
            addWorker(task, false);
            return;
        }
        
        // 4. 达到最大线程数，拒绝任务
        throw new RuntimeException("ThreadPool is full");
    }
    
    private void addWorker(Runnable task, boolean core) {
        Worker worker = new Worker(task, core);
        Thread thread = new Thread(worker);
        worker.thread = thread;
        
        synchronized (workers) {
            workers.add(worker);
        }
        
        threadCount.incrementAndGet();
        thread.start();
    }
    
    public void shutdown() {
        shutdown = true;
        synchronized (workers) {
            for (Worker worker : workers) {
                worker.thread.interrupt();
            }
        }
    }
    
    private class Worker implements Runnable {
        Runnable firstTask;
        Thread thread;
        boolean core;
        
        Worker(Runnable firstTask, boolean core) {
            this.firstTask = firstTask;
            this.core = core;
        }
        
        @Override
        public void run() {
            Runnable task = firstTask;
            firstTask = null;
            
            while (task != null || !shutdown) {
                if (task != null) {
                    try {
                        task.run();
                    } finally {
                        task = null;
                    }
                } else {
                    // 从队列获取任务
                    try {
                        task = workQueue.poll(1, TimeUnit.SECONDS);
                    } catch (InterruptedException e) {
                        break;
                    }
                }
            }
            
            // 线程退出
            synchronized (workers) {
                workers.remove(this);
            }
            threadCount.decrementAndGet();
        }
    }
    
    public static void main(String[] args) {
        SimpleThreadPool pool = new SimpleThreadPool(2, 4, 10);
        
        for (int i = 0; i < 20; i++) {
            int taskId = i;
            pool.execute(() -> {
                System.out.println("任务 " + taskId + " 正在执行，线程: " + 
                    Thread.currentThread().getName());
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            });
        }
        
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        pool.shutdown();
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Lambda 表达式和 Stream API**——也就是 Java 8 引入的函数式编程特性。你会学到：

- Lambda 表达式的语法和原理
- 函数式接口的使用
- Stream API 的操作和原理
- 并行流的使用场景和注意事项

这些知识将帮助你编写更简洁、更函数式的 Java 代码。
