---
title: "第 11 章：集群管理与监控"
description: "集群健康、节点管理、索引生命周期、监控工具"
---

# 第 11 章：集群管理与监控

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何监控集群的健康状态？
- 如何管理节点（添加、移除、维护）？
- 索引生命周期管理是什么？
- 有哪些监控工具可以使用？

这一章会帮你掌握 Elasticsearch 集群的日常管理和监控技能。这是生产环境运维的核心能力。

---

## 1 为什么需要集群管理？

### 痛点分析

生产环境的 Elasticsearch 集群需要持续运维：

- **故障发现**：节点故障、分片异常需要及时发现
- **性能监控**：CPU、内存、磁盘使用率需要持续监控
- **容量规划**：数据增长需要提前规划扩容
- **日常维护**：索引优化、数据清理、版本升级

### 解决方案

建立完善的监控和管理体系：

- 实时监控集群状态
- 自动化告警机制
- 定期维护和优化
- 容量规划和管理

打个比方：

> 集群管理就像开车，需要持续观察仪表盘（监控），定期保养（维护），及时加油（扩容）。

---

## 2 集群健康监控

### 查看集群健康

```bash
# 查看集群健康状态
GET /_cluster/health

# 返回示例
{
  "cluster_name": "my-cluster",
  "status": "green",
  "timed_out": false,
  "number_of_nodes": 3,
  "number_of_data_nodes": 3,
  "active_primary_shards": 15,
  "active_shards": 30,
  "relocating_shards": 0,
  "initializing_shards": 0,
  "unassigned_shards": 0
}
```

### 健康状态说明

| 状态 | 说明 | 处理建议 |
|------|------|---------|
| Green | 所有分片正常 | 正常状态 |
| Yellow | 副本未完全分配 | 检查节点状态，等待分配完成 |
| Red | 主分片未分配 | 立即排查，可能数据丢失 |

### 查看未分配分片原因

```bash
# 查看分片分配解释
GET /_cluster/allocation/explain
{
  "index": "products",
  "shard": 0,
  "primary": false
}

# 返回示例
{
  "index": "products",
  "shard": 0,
  "primary": false,
  "current_state": "unassigned",
  "unassigned_info": {
    "reason": "NODE_LEFT",
    "at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 3 节点管理

### 查看节点信息

```bash
# 查看所有节点
GET /_cat/nodes?v

# 返回示例
# ip         heap.percent ram.percent cpu load_1m node.role master name
# 192.168.1.1           30          50   2    0.50 dim       *      node-1
# 192.168.1.2           25          45   1    0.30 dim       -      node-2
# 192.168.1.3           28          48   3    0.40 dim       -      node-3

# 查看节点详细统计
GET /_nodes/stats
```

### 优雅下线节点

```bash
# 1. 禁止分片分配到该节点
PUT /_cluster/settings
{
  "transient": {
    "cluster.routing.allocation.exclude._name": "node-3"
  }
}

# 2. 等待分片迁移完成
GET /_cat/shards?v

# 3. 停止节点
# 在 node-3 上执行
systemctl stop elasticsearch

# 4. 恢复分片分配（节点重新上线时）
PUT /_cluster/settings
{
  "transient": {
    "cluster.routing.allocation.exclude._name": ""
  }
}
```

### 添加新节点

```yaml
# 新节点的 elasticsearch.yml
cluster.name: my-cluster
node.name: node-4
network.host: 192.168.1.4
discovery.seed_hosts: ["192.168.1.1", "192.168.1.2", "192.168.1.3"]
cluster.initial_master_nodes: ["node-1", "node-2", "node-3"]
```

---

## 4 索引生命周期管理（ILM）

### 概念解释

**索引生命周期管理**（Index Lifecycle Management）用于管理索引从创建到删除的整个过程。

### 生命周期阶段

| 阶段 | 说明 | 操作 |
|------|------|------|
| Hot | 热阶段，活跃写入 | 高性能 SSD，频繁更新 |
| Warm | 温阶段，只读 | 性能较低存储，偶尔查询 |
| Cold | 冷阶段，很少查询 | 低成本存储，压缩 |
| Delete | 删除阶段 | 删除过期索引 |

### 创建 ILM 策略

```bash
PUT /_ilm/policy/logs_policy
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_size": "50GB",
            "max_age": "7d"
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "shrink": {
            "number_of_shards": 1
          },
          "forcemerge": {
            "max_num_segments": 1
          },
          "set_priority": {
            "priority": 50
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "freeze": {},
          "set_priority": {
            "priority": 0
          }
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

### 应用 ILM 策略

```bash
# 创建索引模板，应用 ILM 策略
PUT /_index_template/logs_template
{
  "index_patterns": ["logs-*"],
  "template": {
    "settings": {
      "index.lifecycle.name": "logs_policy",
      "index.lifecycle.rollover_alias": "logs-write"
    }
  }
}

# 创建初始索引
PUT /logs-000001
{
  "aliases": {
    "logs-write": {}
  }
}
```

---

## 5 监控工具

### Cat API

```bash
# 查看集群健康
GET /_cat/health?v

# 查看节点列表
GET /_cat/nodes?v

# 查看索引列表
GET /_cat/indices?v

# 查看分片列表
GET /_cat/shards?v

# 查看别名
GET /_cat/aliases?v

# 查看线程池
GET /_cat/thread_pool?v
```

### 集群统计

```bash
# 查看集群统计信息
GET /_cluster/stats

# 返回示例
{
  "cluster_name": "my-cluster",
  "status": "green",
  "indices": {
    "count": 10,
    "docs": {
      "count": 1000000
    },
    "store": {
      "size_in_bytes": 1073741824
    }
  },
  "nodes": {
    "count": {
      "total": 3,
      "data": 3
    }
  }
}
```

### 节点统计

```bash
# 查看节点统计
GET /_nodes/stats

# 查看特定指标
GET /_nodes/stats/jvm,os,process,fs
```

### 索引统计

```bash
# 查看索引统计
GET /products/_stats

# 查看特定指标
GET /products/_stats/docs,store
```

---

## 6 性能监控指标

### 关键指标

| 指标 | 说明 | 告警阈值 |
|------|------|---------|
| CPU 使用率 | 节点 CPU 使用率 | > 80% |
| JVM 堆内存 | JVM 堆内存使用率 | > 75% |
| 磁盘使用率 | 磁盘空间使用率 | > 85% |
| 查询延迟 | 查询响应时间 | > 1s |
| 索引延迟 | 索引响应时间 | > 500ms |
| 拒绝请求数 | 线程池拒绝的请求 | > 0 |

### 监控 JVM

```bash
# 查看 JVM 统计
GET /_nodes/stats/jvm

# 关键指标
{
  "jvm": {
    "mem": {
      "heap_used_percent": 65,  # 堆内存使用率
      "heap_used_in_bytes": 2147483648
    },
    "gc": {
      "collectors": {
        "young": {
          "collection_count": 100,
          "collection_time_in_millis": 5000
        },
        "old": {
          "collection_count": 5,
          "collection_time_in_millis": 2000
        }
      }
    }
  }
}
```

### 监控线程池

```bash
# 查看线程池统计
GET /_cat/thread_pool?v

# 关键指标
# name   active queue rejected completed
# search      2     0        0      1000
# write       1     0        0       500
```

---

## 7 告警与自动化

### 使用 Watcher 告警

```bash
# 创建告警规则
PUT /_watcher/watch/cluster_health
{
  "trigger": {
    "schedule": {
      "interval": "1m"
    }
  },
  "input": {
    "http": {
      "request": {
        "host": "localhost",
        "port": 9200,
        "path": "/_cluster/health"
      }
    }
  },
  "condition": {
    "compare": {
      "ctx.payload.status": {
        "not_eq": "green"
      }
    }
  },
  "actions": {
    "email_admin": {
      "email": {
        "to": "admin@example.com",
        "subject": "Elasticsearch 集群告警",
        "body": "集群状态异常: {{ctx.payload.status}}"
      }
    }
  }
}
```

### 使用外部监控工具

- **Prometheus + Grafana**：开源监控方案
- **ELK Stack**：Elasticsearch + Logstash + Kibana
- **Datadog**：商业监控平台

---

## 8 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 集群健康 | Green、Yellow、Red 三种状态 |
| 节点管理 | 添加、移除、维护节点 |
| ILM | 索引生命周期管理 |
| 监控工具 | Cat API、统计 API、外部工具 |
| 告警 | Watcher、外部告警系统 |

---

## 9 新手常见误区

### 误区 1："集群状态 Yellow 可以忽略"

**错！** Yellow 表示副本未分配，存在数据丢失风险，需要及时排查。

### 误区 2："不需要监控，出问题再说"

不是的。生产环境必须建立完善的监控体系，及时发现问题。

### 误区 3："ILM 只适用于日志场景"

不是的。任何需要管理索引生命周期的场景都可以使用 ILM。

---

## 10 动手练习

### 练习 1：查看集群状态

查看集群健康状态、节点列表、索引列表。

<details>
<summary>点击查看答案</summary>

```bash
# 查看集群健康
GET /_cluster/health

# 查看节点列表
GET /_cat/nodes?v

# 查看索引列表
GET /_cat/indices?v
```

</details>

### 练习 2：创建 ILM 策略

创建一个 ILM 策略，7 天后滚动，30 天后删除。

<details>
<summary>点击查看答案</summary>

```bash
PUT /_ilm/policy/my_policy
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_age": "7d"
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

</details>

### 练习 3（挑战）：监控 JVM

查看节点的 JVM 堆内存使用情况，判断是否需要优化。

<details>
<summary>点击查看答案</summary>

```bash
# 查看 JVM 统计
GET /_nodes/stats/jvm

# 分析关键指标
{
  "jvm": {
    "mem": {
      "heap_used_percent": 65,  # < 75% 正常
      "heap_max_in_bytes": 4294967296
    },
    "gc": {
      "collectors": {
        "old": {
          "collection_count": 5,  # 老年代 GC 次数
          "collection_time_in_millis": 2000  # GC 时间
        }
      }
    }
  }
}

# 判断标准
# - heap_used_percent < 75%：正常
# - old GC 次数少：正常
# - 如果 heap_used_percent > 85% 或 old GC 频繁：需要优化
```

</details>

---

## 下一章预告

下一章我们会学习 **性能优化实战**——也就是查询优化、索引优化、内存管理、JVM 调优。你会学到如何让 Elasticsearch 跑得更快。
