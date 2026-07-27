---
title: "第七章：集合框架底层原理"
description: "Collection 体系、ArrayList/LinkedList 实现、HashMap 红黑树"
---

# 第七章：集合框架底层原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Java 集合框架的整体架构是怎样的？Collection 和 Map 有什么关系？
- ArrayList 和 LinkedList 底层是怎么实现的？它们的性能差异在哪里？
- HashMap 是怎么工作的？为什么 JDK 1.8 要引入红黑树？
- ConcurrentHashMap 是怎么保证线程安全的？分段锁和 CAS+synchronized 有什么区别？
- 扩容机制是怎么工作的？什么时候会触发扩容？

这一章就是为了解答这些问题。我们会从集合框架的整体架构出发，深入到每个核心集合类的底层实现，搞清楚 **数据结构的选择和算法优化**。

学完本章，你将能够：
- 清楚说出集合框架的完整体系结构
- 理解 ArrayList、LinkedList、HashMap 的底层实现
- 掌握 HashMap 的树化机制和扩容原理
- 了解 ConcurrentHashMap 的并发优化策略

---

## 1 为什么需要集合框架？

### 痛点分析

想象一下这个场景：

你需要存储 100 个用户对象，如果没有集合框架，你可能需要这样做：

```java
// 没有集合时的做法 - 使用数组
User[] users = new User[100];
users[0] = new User("张三");
users[1] = new User("李四");
// ...

// 问题 1：数组长度固定，不够灵活
// 如果要存 101 个用户，必须重新创建数组
User[] newUsers = new User[200];
System.arraycopy(users, 0, newUsers, 0, users.length);
users = newUsers;

// 问题 2：查找效率低
User findUser(String name) {
    for (User user : users) {
        if (user.getName().equals(name)) {
            return user;
        }
    }
    return null;  // O(n) 时间复杂度
}

// 问题 3：插入/删除麻烦
void insertUser(int index, User user) {
    // 需要移动后面的所有元素
    System.arraycopy(users, index, users, index + 1, users.length - index);
    users[index] = user;
}
```

**问题很明显**：
- 数组长度固定，不够灵活
- 查找、插入、删除操作繁琐
- 需要手动管理数组扩容
- 没有统一的操作接口

### 解决方案：集合框架

有了集合框架，操作变得简单：

```java
// 使用集合后的做法
List<User> users = new ArrayList<>();
users.add(new User("张三"));  // 自动扩容
users.add(new User("李四"));

// 查找
User findUser(String name) {
    for (User user : users) {
        if (user.getName().equals(name)) {
            return user;
        }
    }
    return null;
}

// 或者使用 Map 实现 O(1) 查找
Map<String, User> userMap = new HashMap<>();
userMap.put("张三", new User("张三"));
User user = userMap.get("张三");  // O(1) 时间复杂度
```

> **一句话总结**：集合框架提供了统一的数据结构实现，让开发者可以专注于业务逻辑，而不必关心底层实现细节。

---

## 2 核心原理：集合框架体系结构

### 整体架构

```
Collection（接口）
├── List（有序、可重复）
│   ├── ArrayList（动态数组）
│   ├── LinkedList（双向链表）
│   └── Vector（线程安全的动态数组，已过时）
│
├── Set（无序、不可重复）
│   ├── HashSet（基于 HashMap）
│   ├── LinkedHashSet（保持插入顺序）
│   └── TreeSet（红黑树，有序）
│
└── Queue（队列）
    ├── LinkedList（也实现了 Queue）
    ├── PriorityQueue（优先队列）
    └── ArrayDeque（双端队列）

Map（接口，键值对）
├── HashMap（数组+链表+红黑树）
├── LinkedHashMap（保持插入/访问顺序）
├── TreeMap（红黑树，有序）
├── Hashtable（线程安全，已过时）
└── ConcurrentHashMap（线程安全）
```

### Collection vs Map

| 特性 | Collection | Map |
|------|-----------|-----|
| 存储结构 | 单个元素 | 键值对 |
| 接口关系 | 独立接口 | 独立接口 |
| 典型实现 | List、Set、Queue | HashMap、TreeMap |
| 遍历方式 | Iterator、forEach | keySet、entrySet、values |
| 是否可重复 | List 可重复，Set 不可重复 | Key 不可重复，Value 可重复 |

---

## 3 ArrayList 底层原理

### 数据结构

ArrayList 底层使用**动态数组**实现：

```java
public class ArrayList<E> implements List<E> {
    
    // 底层数组
    transient Object[] elementData;
    
    // 实际元素个数
    private int size;
    
    // 默认初始容量
    private static final int DEFAULT_CAPACITY = 10;
    
    // 空数组
    private static final Object[] EMPTY_ELEMENTDATA = {};
    
    // 默认空数组
    private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};
    
    // 构造函数
    public ArrayList() {
        this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
    }
    
    public ArrayList(int initialCapacity) {
        if (initialCapacity > 0) {
            this.elementData = new Object[initialCapacity];
        } else if (initialCapacity == 0) {
            this.elementData = EMPTY_ELEMENTDATA;
        } else {
            throw new IllegalArgumentException("Illegal Capacity: " + initialCapacity);
        }
    }
}
```

### 添加元素

```java
// 添加元素到末尾
public boolean add(E e) {
    // 1. 确保容量足够
    ensureCapacityInternal(size + 1);
    
    // 2. 将元素放入数组
    elementData[size++] = e;
    return true;
}

// 确保容量
private void ensureCapacityInternal(int minCapacity) {
    // 如果是默认空数组，使用默认容量 10
    if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
        minCapacity = Math.max(DEFAULT_CAPACITY, minCapacity);
    }
    
    ensureExplicitCapacity(minCapacity);
}

private void ensureExplicitCapacity(int minCapacity) {
    // 如果需要的容量超过当前数组长度，需要扩容
    if (minCapacity - elementData.length > 0) {
        grow(minCapacity);
    }
}
```

### 扩容机制

```java
// 扩容
private void grow(int minCapacity) {
    // 旧容量
    int oldCapacity = elementData.length;
    
    // 新容量 = 旧容量的 1.5 倍
    int newCapacity = oldCapacity + (oldCapacity >> 1);
    
    // 如果新容量还不够，使用需要的容量
    if (newCapacity - minCapacity < 0) {
        newCapacity = minCapacity;
    }
    
    // 如果新容量超过最大限制，使用最大容量
    if (newCapacity - MAX_ARRAY_SIZE > 0) {
        newCapacity = hugeCapacity(minCapacity);
    }
    
    // 复制数组
    elementData = Arrays.copyOf(elementData, newCapacity);
}

// 最大容量
private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;

private static int hugeCapacity(int minCapacity) {
    if (minCapacity < 0) {
        throw new OutOfMemoryError();
    }
    return (minCapacity > MAX_ARRAY_SIZE) ? Integer.MAX_VALUE : MAX_ARRAY_SIZE;
}
```

> **生活化类比**：
> ArrayList 就像"可扩容的仓库"：
> - 初始容量 10 个货架
> - 每次满了就扩建 1.5 倍
> - 扩容时需要把所有货物搬到新仓库（System.arraycopy）

### 插入和删除

```java
// 在指定位置插入
public void add(int index, E element) {
    // 1. 检查索引是否合法
    rangeCheckForAdd(index);
    
    // 2. 确保容量
    ensureCapacityInternal(size + 1);
    
    // 3. 移动后面的元素
    System.arraycopy(elementData, index, elementData, index + 1, size - index);
    
    // 4. 放入新元素
    elementData[index] = element;
    size++;
}

// 删除指定位置的元素
public E remove(int index) {
    // 1. 检查索引
    rangeCheck(index);
    
    // 2. 获取旧值
    E oldValue = elementData(index);
    
    // 3. 移动后面的元素
    int numMoved = size - index - 1;
    if (numMoved > 0) {
        System.arraycopy(elementData, index + 1, elementData, index, numMoved);
    }
    
    // 4. 清空最后一个位置
    elementData[--size] = null;
    
    return oldValue;
}
```

### System.arraycopy 的底层

```java
// System.arraycopy 是 native 方法，直接操作内存
public static native void arraycopy(
    Object src,     // 源数组
    int srcPos,     // 源数组起始位置
    Object dest,    // 目标数组
    int destPos,    // 目标数组起始位置
    int length      // 复制长度
);

// 时间复杂度：O(n)
// 但因为是 native 方法，比 Java 代码快得多
```

---

## 4 LinkedList 底层原理

### 数据结构

LinkedList 底层使用**双向链表**实现：

```java
public class LinkedList<E> implements List<E>, Deque<E> {
    
    // 链表大小
    transient int size = 0;
    
    // 头节点
    transient Node<E> first;
    
    // 尾节点
    transient Node<E> last;
    
    // 节点类
    private static class Node<E> {
        E item;           // 数据
        Node<E> next;     // 后继节点
        Node<E> prev;     // 前驱节点
        
        Node(Node<E> prev, E element, Node<E> next) {
            this.prev = prev;
            this.item = element;
            this.next = next;
        }
    }
}
```

### 添加元素

```java
// 添加到末尾
public boolean add(E e) {
    linkLast(e);
    return true;
}

// 链接到末尾
void linkLast(E e) {
    final Node<E> l = last;
    final Node<E> newNode = new Node<>(l, e, null);
    last = newNode;
    
    if (l == null) {
        first = newNode;  // 空链表
    } else {
        l.next = newNode;  // 非空链表
    }
    size++;
    modCount++;
}

// 添加到开头
public void addFirst(E e) {
    linkFirst(e);
}

private void linkFirst(E e) {
    final Node<E> f = first;
    final Node<E> newNode = new Node<>(null, e, f);
    first = newNode;
    
    if (f == null) {
        last = newNode;
    } else {
        f.prev = newNode;
    }
    size++;
    modCount++;
}
```

### 查找元素

```java
// 根据索引查找
public E get(int index) {
    checkElementIndex(index);
    return node(index).item;
}

// 查找指定索引的节点
Node<E> node(int index) {
    // 优化：从较近的一端开始遍历
    if (index < (size >> 1)) {
        // 前半部分，从头开始
        Node<E> x = first;
        for (int i = 0; i < index; i++) {
            x = x.next;
        }
        return x;
    } else {
        // 后半部分，从尾开始
        Node<E> x = last;
        for (int i = size - 1; i > index; i--) {
            x = x.prev;
        }
        return x;
    }
}
```

### 删除元素

```java
// 删除指定节点
private E unlink(Node<E> x) {
    final E element = x.item;
    final Node<E> next = x.next;
    final Node<E> prev = x.prev;
    
    if (prev == null) {
        first = next;  // 删除的是头节点
    } else {
        prev.next = next;
        x.prev = null;
    }
    
    if (next == null) {
        last = prev;  // 删除的是尾节点
    } else {
        next.prev = prev;
        x.next = null;
    }
    
    x.item = null;
    size--;
    modCount++;
    return element;
}
```

> **生活化类比**：
> LinkedList 就像"火车车厢"：
> - 每节车厢（节点）都有前后连接
> - 添加/删除车厢只需要修改前后车厢的连接
> - 但找某节车厢需要从前往后或从后往前数

---

## 5 HashMap 底层原理

### 数据结构（JDK 1.8）

HashMap 使用**数组+链表+红黑树**：

```java
public class HashMap<K,V> implements Map<K,V> {
    
    // 默认初始容量 16
    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4;
    
    // 最大容量 2^30
    static final int MAXIMUM_CAPACITY = 1 << 30;
    
    // 默认负载因子 0.75
    static final float DEFAULT_LOAD_FACTOR = 0.75f;
    
    // 树化阈值 8
    static final int TREEIFY_THRESHOLD = 8;
    
    // 退化阈值 6
    static final int UNTREEIFY_THRESHOLD = 6;
    
    // 最小树化容量 64
    static final int MIN_TREEIFY_CAPACITY = 64;
    
    // 底层数组
    transient Node<K,V>[] table;
    
    // 存储的键值对数量
    transient int size;
    
    // 修改次数
    transient int modCount;
    
    // 阈值（容量 * 负载因子）
    int threshold;
    
    // 负载因子
    final float loadFactor;
}

// 节点类
static class Node<K,V> implements Map.Entry<K,V> {
    final int hash;      // hash 值
    final K key;         // 键
    V value;             // 值
    Node<K,V> next;      // 下一个节点（链表）
    
    Node(int hash, K key, V value, Node<K,V> next) {
        this.hash = hash;
        this.key = key;
        this.value = value;
        this.next = next;
    }
}

// 红黑树节点
static final class TreeNode<K,V> extends Node<K,V> {
    TreeNode<K,V> parent;   // 父节点
    TreeNode<K,V> left;     // 左子节点
    TreeNode<K,V> right;    // 右子节点
    TreeNode<K,V> prev;     // 前驱节点
    boolean red;            // 颜色
}
```

### Hash 计算

```java
// 计算 hash 值
static final int hash(Object key) {
    int h;
    // 高 16 位与低 16 位异或，减少碰撞
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}

// 计算数组索引
// (n - 1) & hash 等同于 hash % n，但更快
static int indexFor(int hash, int length) {
    return hash & (length - 1);
}
```

### 添加元素

```java
// 添加键值对
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}

final V putVal(int hash, K key, V value, boolean onlyIfAbsent, boolean evict) {
    Node<K,V>[] tab;
    Node<K,V> p;
    int n, i;
    
    // 1. 如果数组为空，初始化
    if ((tab = table) == null || (n = tab.length) == 0) {
        tab = resize();
        n = tab.length;
    }
    
    // 2. 计算索引，如果该位置为空，直接放入
    if ((p = tab[i = (n - 1) & hash]) == null) {
        tab[i] = newNode(hash, key, value, null);
    } else {
        // 3. 该位置已有元素，处理冲突
        Node<K,V> e;
        K k;
        
        // 如果 key 相同，覆盖
        if (p.hash == hash && ((k = p.key) == key || (key != null && key.equals(k)))) {
            e = p;
        } else if (p instanceof TreeNode) {
            // 如果是红黑树节点，使用树的方式插入
            e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
        } else {
            // 遍历链表
            for (int binCount = 0; ; ++binCount) {
                if ((e = p.next) == null) {
                    // 插入到链表末尾
                    p.next = newNode(hash, key, value, null);
                    
                    // 如果链表长度 >= 8，考虑树化
                    if (binCount >= TREEIFY_THRESHOLD - 1) {
                        treeifyBin(tab, hash);
                    }
                    break;
                }
                
                // 如果找到相同的 key
                if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))) {
                    break;
                }
                
                p = e;
            }
        }
        
        // 如果找到相同的 key，覆盖值
        if (e != null) {
            V oldValue = e.value;
            if (!onlyIfAbsent || oldValue == null) {
                e.value = value;
            }
            return oldValue;
        }
    }
    
    ++modCount;
    
    // 4. 如果超过阈值，扩容
    if (++size > threshold) {
        resize();
    }
    
    return null;
}
```

### 树化机制

```java
// 树化链表
final void treeifyBin(Node<K,V>[] tab, int hash) {
    int n, index;
    Node<K,V> e;
    
    // 如果数组长度 < 64，优先扩容而不是树化
    if (tab == null || (n = tab.length) < MIN_TREEIFY_CAPACITY) {
        resize();
    } else {
        // 将链表转换为红黑树
        e = tab[index = (n - 1) & hash];
        if (e != null) {
            TreeNode<K,V> hd = null, tl = null;
            do {
                TreeNode<K,V> p = new TreeNode<>(e.hash, e.key, e.value, null);
                if ((p.prev = tl) == null) {
                    hd = p;
                } else {
                    tl.next = p;
                }
                tl = p;
            } while ((e = e.next) != null);
            
            // 将树节点放入数组
            tab[index] = hd;
            // 构建红黑树
            hd.treeify(this, tab);
        }
    }
}
```

### 扩容机制

```java
// 扩容
final Node<K,V>[] resize() {
    Node<K,V>[] oldTab = table;
    int oldCap = (oldTab == null) ? 0 : oldTab.length;
    int oldThr = threshold;
    int newCap, newThr = 0;
    
    if (oldCap > 0) {
        // 如果超过最大容量，不再扩容
        if (oldCap >= MAXIMUM_CAPACITY) {
            threshold = Integer.MAX_VALUE;
            return oldTab;
        }
        // 新容量 = 旧容量 * 2
        else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY && oldCap >= DEFAULT_INITIAL_CAPACITY) {
            newThr = oldThr << 1;
        }
    } else if (oldThr > 0) {
        newCap = oldThr;
    } else {
        newCap = DEFAULT_INITIAL_CAPACITY;
        newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
    }
    
    if (newThr == 0) {
        float ft = (float)newCap * loadFactor;
        newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ? (int)ft : Integer.MAX_VALUE);
    }
    
    threshold = newThr;
    
    // 创建新数组
    Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
    table = newTab;
    
    // 重新分配元素
    if (oldTab != null) {
        for (int j = 0; j < oldCap; ++j) {
            Node<K,V> e;
            if ((e = oldTab[j]) != null) {
                oldTab[j] = null;
                
                if (e.next == null) {
                    // 单个节点，直接重新计算位置
                    newTab[e.hash & (newCap - 1)] = e;
                } else if (e instanceof TreeNode) {
                    // 红黑树节点
                    ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                } else {
                    // 链表节点 - 优化：不需要重新计算 hash
                    Node<K,V> loHead = null, loTail = null;  // 低位链表
                    Node<K,V> hiHead = null, hiTail = null;  // 高位链表
                    Node<K,V> next;
                    
                    do {
                        next = e.next;
                        // 如果 hash 值的第 oldCap 位为 0，放在低位
                        if ((e.hash & oldCap) == 0) {
                            if (loTail == null) {
                                loHead = e;
                            } else {
                                loTail.next = e;
                            }
                            loTail = e;
                        } else {
                            // 否则放在高位
                            if (hiTail == null) {
                                hiHead = e;
                            } else {
                                hiTail.next = e;
                            }
                            hiTail = e;
                        }
                    } while ((e = next) != null);
                    
                    // 低位链表放在原位置
                    if (loTail != null) {
                        loTail.next = null;
                        newTab[j] = loHead;
                    }
                    // 高位链表放在 j + oldCap 位置
                    if (hiTail != null) {
                        hiTail.next = null;
                        newTab[j + oldCap] = hiHead;
                    }
                }
            }
        }
    }
    
    return newTab;
}
```

> **生活化类比**：
> HashMap 就像"带抽屉的柜子"：
> - 数组是柜子的抽屉
> - 链表是同一个抽屉里的多个盒子（hash 冲突）
> - 红黑树是当盒子里的东西太多时，用更高效的组织方式
> - 扩容就是换一个更大的柜子，把东西重新摆放

---

## 6 ConcurrentHashMap 原理

### JDK 1.7：分段锁

```java
// JDK 1.7 的实现
public class ConcurrentHashMap<K,V> {
    
    // 分段数组
    final Segment<K,V>[] segments;
    
    // 每个 Segment 是一个小的 HashMap
    static class Segment<K,V> extends ReentrantLock {
        transient volatile int count;
        transient int threshold;
        final float loadFactor;
        transient final HashEntry<K,V>[] table;
    }
    
    // 默认并发级别 16
    static final int DEFAULT_CONCURRENCY_LEVEL = 16;
}
```

> **生活化类比**：
> JDK 1.7 的 ConcurrentHashMap 就像"有多个管理员的仓库"：
> - 仓库分成 16 个区域（Segment）
> - 每个区域有一个管理员（锁）
> - 不同区域可以同时操作，互不影响

### JDK 1.8：CAS + synchronized

```java
// JDK 1.8 的实现
public class ConcurrentHashMap<K,V> {
    
    // 底层数组
    transient volatile Node<K,V>[] table;
    
    // 节点类
    static class Node<K,V> implements Map.Entry<K,V> {
        final int hash;
        final K key;
        volatile V value;
        volatile Node<K,V> next;
    }
    
    // 添加元素
    public V put(K key, V value) {
        return putVal(key, value, false);
    }
    
    final V putVal(K key, V value, boolean onlyIfAbsent) {
        if (key == null || value == null) throw new NullPointerException();
        
        int hash = spread(key.hashCode());
        int binCount = 0;
        
        for (Node<K,V>[] tab = table;;) {
            Node<K,V> f; int n, i, fh;
            
            if (tab == null || (n = tab.length) == 0) {
                tab = initTable();  // 初始化表格
            } else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
                // 如果该位置为空，使用 CAS 插入
                if (casTabAt(tab, i, null, new Node<K,V>(hash, key, value, null))) {
                    break;
                }
            } else if ((fh = f.hash) == MOVED) {
                tab = helpTransfer(tab, f);  // 帮助扩容
            } else {
                V oldVal = null;
                
                // 使用 synchronized 锁定该节点
                synchronized (f) {
                    if (tabAt(tab, i) == f) {
                        if (fh >= 0) {
                            binCount = 1;
                            for (Node<K,V> e = f;; ++binCount) {
                                K ek;
                                if (e.hash == hash && ((ek = e.key) == key || (key != null && key.equals(ek)))) {
                                    oldVal = e.val;
                                    if (!onlyIfAbsent) {
                                        e.val = value;
                                    }
                                    break;
                                }
                                Node<K,V> pred = e;
                                if ((e = e.next) == null) {
                                    pred.next = new Node<K,V>(hash, key, value, null);
                                    break;
                                }
                            }
                        } else if (f instanceof TreeBin) {
                            // 红黑树操作
                            TreeBin<K,V> t = (TreeBin<K,V>)f;
                            // ...
                        }
                    }
                }
                
                if (binCount != 0) {
                    if (binCount >= TREEIFY_THRESHOLD) {
                        treeifyBin(tab, i);
                    }
                    if (oldVal != null) {
                        return oldVal;
                    }
                    break;
                }
            }
        }
        
        addCount(1L, binCount);
        return null;
    }
}
```

> **生活化类比**：
> JDK 1.8 的 ConcurrentHashMap 就像"智能仓库"：
> - 空闲的抽屉可以直接放入（CAS）
> - 有冲突时才加锁（synchronized）
> - 锁的粒度更细，只锁一个抽屉

---

## 7 HashSet 与 HashMap 的关系

### HashSet 的底层实现

```java
public class HashSet<E> implements Set<E> {
    
    // 底层使用 HashMap
    private transient HashMap<E,Object> map;
    
    // 虚拟值
    private static final Object PRESENT = new Object();
    
    // 构造函数
    public HashSet() {
        map = new HashMap<>();
    }
    
    // 添加元素
    public boolean add(E e) {
        return map.put(e, PRESENT) == null;
    }
    
    // 删除元素
    public boolean remove(Object o) {
        return map.remove(o) == PRESENT;
    }
    
    // 判断是否包含
    public boolean contains(Object o) {
        return map.containsKey(o);
    }
}
```

> **一句话总结**：HashSet 就是 HashMap 的简化版，只使用 key，value 是一个固定的虚拟值。

---

## 8 核心知识点总结

### 集合类对比

| 集合类 | 底层结构 | 线程安全 | 有序性 | 时间复杂度 | 适用场景 |
|--------|----------|----------|--------|------------|----------|
| ArrayList | 动态数组 | 否 | 有序（索引） | 查找 O(1)，插入/删除 O(n) | 频繁查找 |
| LinkedList | 双向链表 | 否 | 有序（索引） | 查找 O(n)，插入/删除 O(1) | 频繁插入/删除 |
| HashMap | 数组+链表+红黑树 | 否 | 无序 | 查找/插入/删除 O(1) | 键值对存储 |
| TreeMap | 红黑树 | 否 | 有序（key） | 查找/插入/删除 O(log n) | 需要排序 |
| HashSet | HashMap | 否 | 无序 | 添加/删除/查找 O(1) | 去重 |
| ConcurrentHashMap | 数组+链表+红黑树 | 是 | 无序 | 查找/插入/删除 O(1) | 并发键值对存储 |

### 扩容机制对比

| 集合类 | 初始容量 | 扩容时机 | 扩容倍数 | 扩容操作 |
|--------|----------|----------|----------|----------|
| ArrayList | 10（默认） | size >= capacity | 1.5 倍 | System.arraycopy |
| HashMap | 16 | size > threshold | 2 倍 | 重新计算位置 |
| ConcurrentHashMap | 16 | size > threshold | 2 倍 | 重新计算位置 |

---

## 9 新手常见误区

### 误区 1："ArrayList 比 LinkedList 慢"

**错！** 要看具体场景：

```java
// ❌ 错误：在中间插入用 LinkedList
LinkedList<User> list = new LinkedList<>();
for (int i = 0; i < 10000; i++) {
    list.add(i / 2, new User("用户" + i));  // 每次都要遍历到中间位置
}

// ✅ 正确：在末尾添加用 ArrayList
ArrayList<User> list = new ArrayList<>();
for (int i = 0; i < 10000; i++) {
    list.add(new User("用户" + i));  // O(1) 时间复杂度
}

// 性能对比：
// ArrayList 末尾添加：O(1)
// LinkedList 中间插入：O(n)（需要遍历）
```

### 误区 2："HashMap 的容量可以是任意值"

**错！** HashMap 的容量必须是 2 的幂：

```java
// ❌ 错误：指定非 2 的幂的容量
HashMap<String, Object> map = new HashMap<>(15);  // 实际容量会是 16

// ✅ 正确：使用 2 的幂
HashMap<String, Object> map = new HashMap<>(16);  // 容量就是 16

// 原因：(n - 1) & hash 只有在 n 是 2 的幂时才等同于 hash % n
// 16 - 1 = 15 = 0b1111
// hash & 15 可以快速计算索引
```

### 误区 3："HashMap 是线程安全的"

**错！** HashMap 不是线程安全的：

```java
// ❌ 错误：在多线程中使用 HashMap
Map<String, Object> map = new HashMap<>();
// 多个线程同时 put 可能导致数据丢失或死循环（JDK 1.7）

// ✅ 正确：使用 ConcurrentHashMap
Map<String, Object> map = new ConcurrentHashMap<>();
```

### 误区 4："HashSet 是独立的数据结构"

**错！** HashSet 底层就是 HashMap：

```java
// HashSet 的实现
public class HashSet<E> {
    private transient HashMap<E,Object> map;
    private static final Object PRESENT = new Object();
    
    public boolean add(E e) {
        return map.put(e, PRESENT) == null;
    }
}

// HashSet 只使用 HashMap 的 key，value 是固定的 PRESENT 对象
```

### 误区 5："HashMap 的负载因子越大越好"

**错！** 负载因子需要在时间和空间之间权衡：

```java
// 负载因子 = 0.75（默认）
// 意味着 75% 的容量被使用时就会扩容

// 负载因子大（如 1.0）：
// - 优点：节省空间
// - 缺点：冲突增加，查找变慢

// 负载因子小（如 0.5）：
// - 优点：冲突少，查找快
// - 缺点：浪费空间，频繁扩容

// 建议：除非有特殊需求，否则使用默认值 0.75
```

---

## 10 动手练习

### 练习 1：基础题

请回答以下问题：

1. ArrayList 和 LinkedList 的区别是什么？
2. HashMap 的底层结构是什么？为什么引入红黑树？
3. HashMap 的扩容机制是怎样的？

<details>
<summary>点击查看答案</summary>

1. **ArrayList 和 LinkedList 的区别**：
   - ArrayList 底层是动态数组，LinkedList 底层是双向链表
   - ArrayList 查找快（O(1)），插入/删除慢（O(n)）
   - LinkedList 查找慢（O(n)），插入/删除快（O(1)）
   - ArrayList 支持随机访问，LinkedList 不支持

2. **HashMap 的底层结构**：
   - JDK 1.8：数组 + 链表 + 红黑树
   - 引入红黑树的原因：当 hash 冲突严重时，链表会变得很长，查找时间从 O(1) 退化到 O(n)
   - 红黑树可以将查找时间优化到 O(log n)

3. **HashMap 的扩容机制**：
   - 初始容量 16，负载因子 0.75
   - 当 size > threshold（容量 * 负载因子）时触发扩容
   - 扩容为原来的 2 倍
   - 重新计算每个元素的位置（优化：不需要重新计算 hash）

</details>

### 练习 2：进阶题

请实现一个简单的 LRU 缓存，使用 LinkedHashMap 实现。

<details>
<summary>点击查看答案</summary>

```java
import java.util.LinkedHashMap;
import java.util.Map;

public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    
    private final int capacity;
    
    public LRUCache(int capacity) {
        // 调用父类构造函数，accessOrder = true 表示按访问顺序排序
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }
    
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        // 当元素数量超过容量时，删除最老的元素
        return size() > capacity;
    }
    
    public static void main(String[] args) {
        LRUCache<Integer, String> cache = new LRUCache<>(3);
        
        cache.put(1, "A");
        cache.put(2, "B");
        cache.put(3, "C");
        
        System.out.println(cache);  // {1=A, 2=B, 3=C}
        
        // 访问 key=1，使其变为最近使用的
        cache.get(1);
        System.out.println(cache);  // {2=B, 3=C, 1=A}
        
        // 添加新元素，超过容量，删除最老的（key=2）
        cache.put(4, "D");
        System.out.println(cache);  // {3=C, 1=A, 4=D}
    }
}
```

</details>

### 练习 3（挑战）：综合题

请实现一个简单的 HashMap，支持 put、get、remove 操作，使用数组+链表的方式处理 hash 冲突。

<details>
<summary>点击查看答案</summary>

```java
public class SimpleHashMap<K, V> {
    
    // 默认容量
    private static final int DEFAULT_CAPACITY = 16;
    
    // 负载因子
    private static final float LOAD_FACTOR = 0.75f;
    
    // 底层数组
    private Node<K, V>[] table;
    
    // 元素个数
    private int size;
    
    // 阈值
    private int threshold;
    
    // 节点类
    private static class Node<K, V> {
        final int hash;
        final K key;
        V value;
        Node<K, V> next;
        
        Node(int hash, K key, V value, Node<K, V> next) {
            this.hash = hash;
            this.key = key;
            this.value = value;
            this.next = next;
        }
    }
    
    public SimpleHashMap() {
        table = new Node[DEFAULT_CAPACITY];
        threshold = (int) (DEFAULT_CAPACITY * LOAD_FACTOR);
    }
    
    // 计算 hash
    private int hash(Object key) {
        if (key == null) return 0;
        int h = key.hashCode();
        return h ^ (h >>> 16);
    }
    
    // 添加元素
    public V put(K key, V value) {
        if (key == null) return putNull(key, value);
        
        int hash = hash(key);
        int index = hash & (table.length - 1);
        
        // 检查是否已存在
        for (Node<K, V> node = table[index]; node != null; node = node.next) {
            if (node.hash == hash && (node.key == key || key.equals(node.key))) {
                V oldValue = node.value;
                node.value = value;
                return oldValue;
            }
        }
        
        // 添加新节点
        Node<K, V> newNode = new Node<>(hash, key, value, table[index]);
        table[index] = newNode;
        size++;
        
        // 检查是否需要扩容
        if (size > threshold) {
            resize();
        }
        
        return null;
    }
    
    private V putNull(K key, V value) {
        // 处理 null key
        for (Node<K, V> node = table[0]; node != null; node = node.next) {
            if (node.key == null) {
                V oldValue = node.value;
                node.value = value;
                return oldValue;
            }
        }
        
        Node<K, V> newNode = new Node<>(0, null, value, table[0]);
        table[0] = newNode;
        size++;
        return null;
    }
    
    // 获取元素
    public V get(Object key) {
        int hash = hash(key);
        int index = hash & (table.length - 1);
        
        for (Node<K, V> node = table[index]; node != null; node = node.next) {
            if (node.hash == hash && (node.key == key || (key != null && key.equals(node.key)))) {
                return node.value;
            }
        }
        
        return null;
    }
    
    // 删除元素
    public V remove(Object key) {
        int hash = hash(key);
        int index = hash & (table.length - 1);
        
        Node<K, V> prev = null;
        Node<K, V> node = table[index];
        
        while (node != null) {
            if (node.hash == hash && (node.key == key || (key != null && key.equals(node.key)))) {
                V value = node.value;
                
                if (prev == null) {
                    table[index] = node.next;
                } else {
                    prev.next = node.next;
                }
                
                size--;
                return value;
            }
            
            prev = node;
            node = node.next;
        }
        
        return null;
    }
    
    // 扩容
    private void resize() {
        int newCapacity = table.length * 2;
        Node<K, V>[] newTable = new Node[newCapacity];
        
        for (Node<K, V> node : table) {
            while (node != null) {
                Node<K, V> next = node.next;
                int index = node.hash & (newCapacity - 1);
                node.next = newTable[index];
                newTable[index] = node;
                node = next;
            }
        }
        
        table = newTable;
        threshold = (int) (newCapacity * LOAD_FACTOR);
    }
    
    public int size() {
        return size;
    }
    
    public static void main(String[] args) {
        SimpleHashMap<String, Integer> map = new SimpleHashMap<>();
        
        map.put("one", 1);
        map.put("two", 2);
        map.put("three", 3);
        
        System.out.println(map.get("one"));    // 1
        System.out.println(map.get("two"));    // 2
        System.out.println(map.size());        // 3
        
        map.remove("two");
        System.out.println(map.size());        // 2
        System.out.println(map.get("two"));    // null
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **并发编程原理**——也就是 Java 多线程的底层机制。你会学到：

- 线程的本质和 Java 线程模型
- Java 内存模型（JMM）和 happens-before 原则
- volatile 和 synchronized 的底层原理
- 锁升级机制（无锁→偏向锁→轻量级锁→重量级锁）
- AQS 框架和线程池原理

这些知识将帮助你理解 Java 并发编程的底层机制，以及如何编写高效的并发程序。
