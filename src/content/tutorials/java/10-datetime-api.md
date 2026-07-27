---
title: '第十章：日期时间 API'
description: 'LocalDate、LocalTime、DateTimeFormatter、时区处理'
---

# 第十章：日期时间 API

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Java 8 之前的 Date 和 Calendar 有什么问题？
- LocalDate、LocalTime、LocalDateTime 有什么区别？
- 如何格式化日期时间？
- 如何计算两个日期之间的间隔？
- 如何处理时区问题？

这一章就是为了解答这些问题。我们会先理解 **Java 8 日期时间 API 的设计思想**，再学习常用的日期时间类，最后掌握格式化、计算和时区处理。学完这章，你就能优雅地处理日期时间了。

---

## 1 为什么需要新的日期时间 API？

### 旧 API 的问题

Java 8 之前，处理日期时间主要使用 `Date` 和 `Calendar` 类，但它们有很多问题：

```java
// ❌ Date 类的问题
Date date = new Date();
System.out.println(date);  // Mon Jan 15 10:30:45 CST 2024

// 问题 1：可变性 - Date 对象可以被修改
date.setDate(20);  // 修改日期，不安全

// 问题 2：线程不安全 - 多线程环境下可能出问题

// 问题 3：设计混乱 - 月份从 0 开始，年份从 1900 开始
Date oldDate = new Date(124, 0, 15);  // 2024年1月15日（124 = 2024-1900，0 = 1月）
System.out.println(oldDate.getYear());  // 124（不是 2024）
System.out.println(oldDate.getMonth());  // 0（不是 1）
```

### 新 API 的优势

Java 8 引入了全新的日期时间 API（`java.time` 包），解决了旧 API 的所有问题：

| 特性 | 旧 API | 新 API |
|------|--------|--------|
| 可变性 | 可变（不安全） | 不可变（线程安全） |
| 设计 | 混乱（月份从0开始） | 清晰（月份从1开始） |
| 线程安全 | 不安全 | 安全 |
| API 设计 | 复杂难用 | 简洁直观 |
| 时区处理 | 不完善 | 完善 |

---

## 2 LocalDate、LocalTime、LocalDateTime

### LocalDate（日期）

`LocalDate` 表示日期（年-月-日），不包含时间和时区。

```java
import java.time.LocalDate;

// 获取当前日期
LocalDate today = LocalDate.now();
System.out.println(today);  // 2024-01-15

// 创建指定日期
LocalDate birthday = LocalDate.of(2000, 5, 20);  // 2000年5月20日
System.out.println(birthday);  // 2000-05-20

// 从字符串解析
LocalDate parsed = LocalDate.parse("2024-03-15");
System.out.println(parsed);  // 2024-03-15

// 获取日期信息
System.out.println("年：" + today.getYear());  // 2024
System.out.println("月：" + today.getMonthValue());  // 1
System.out.println("日：" + today.getDayOfMonth());  // 15
System.out.println("星期：" + today.getDayOfWeek());  // MONDAY

// 日期计算
LocalDate tomorrow = today.plusDays(1);
LocalDate nextMonth = today.plusMonths(1);
LocalDate nextYear = today.plusYears(1);
System.out.println("明天：" + tomorrow);
System.out.println("下个月：" + nextMonth);
System.out.println("明年：" + nextYear);

// 日期比较
LocalDate date1 = LocalDate.of(2024, 1, 15);
LocalDate date2 = LocalDate.of(2024, 2, 20);
System.out.println(date1.isBefore(date2));  // true
System.out.println(date1.isAfter(date2));  // false
System.out.println(date1.isEqual(date2));  // false
```

### LocalTime（时间）

`LocalTime` 表示时间（时:分:秒.纳秒），不包含日期和时区。

```java
import java.time.LocalTime;

// 获取当前时间
LocalTime now = LocalTime.now();
System.out.println(now);  // 10:30:45.123

// 创建指定时间
LocalTime meetingTime = LocalTime.of(14, 30);  // 14:30:00
System.out.println(meetingTime);  // 14:30

LocalTime preciseTime = LocalTime.of(14, 30, 45, 123456789);  // 14:30:45.123456789
System.out.println(preciseTime);  // 14:30:45.123456789

// 从字符串解析
LocalTime parsed = LocalTime.parse("14:30:45");
System.out.println(parsed);  // 14:30:45

// 获取时间信息
System.out.println("时：" + now.getHour());  // 10
System.out.println("分：" + now.getMinute());  // 30
System.out.println("秒：" + now.getSecond());  // 45

// 时间计算
LocalTime oneHourLater = now.plusHours(1);
LocalTime halfHourLater = now.plusMinutes(30);
System.out.println("1小时后：" + oneHourLater);
System.out.println("30分钟后：" + halfHourLater);

// 时间比较
LocalTime time1 = LocalTime.of(10, 30);
LocalTime time2 = LocalTime.of(14, 45);
System.out.println(time1.isBefore(time2));  // true
```

### LocalDateTime（日期时间）

`LocalDateTime` 表示日期和时间（年-月-日 时:分:秒），不包含时区。

```java
import java.time.LocalDateTime;

// 获取当前日期时间
LocalDateTime now = LocalDateTime.now();
System.out.println(now);  // 2024-01-15T10:30:45.123

// 创建指定日期时间
LocalDateTime meeting = LocalDateTime.of(2024, 1, 15, 14, 30);
System.out.println(meeting);  // 2024-01-15T14:30

// 从 LocalDate 和 LocalTime 组合
LocalDate date = LocalDate.of(2024, 1, 15);
LocalTime time = LocalTime.of(14, 30);
LocalDateTime dateTime = LocalDateTime.of(date, time);
System.out.println(dateTime);  // 2024-01-15T14:30

// 从字符串解析
LocalDateTime parsed = LocalDateTime.parse("2024-01-15T14:30:45");
System.out.println(parsed);  // 2024-01-15T14:30:45

// 获取日期和时间信息
System.out.println("年：" + now.getYear());  // 2024
System.out.println("月：" + now.getMonthValue());  // 1
System.out.println("日：" + now.getDayOfMonth());  // 15
System.out.println("时：" + now.getHour());  // 10
System.out.println("分：" + now.getMinute());  // 30

// 日期时间计算
LocalDateTime tomorrow = now.plusDays(1);
LocalDateTime nextHour = now.plusHours(1);
System.out.println("明天：" + tomorrow);
System.out.println("1小时后：" + nextHour);

// 提取日期或时间
LocalDate datePart = now.toLocalDate();
LocalTime timePart = now.toLocalTime();
System.out.println("日期部分：" + datePart);  // 2024-01-15
System.out.println("时间部分：" + timePart);  // 10:30:45.123
```

---

## 3 DateTimeFormatter（格式化）

`DateTimeFormatter` 用于格式化和解析日期时间。

### 预定义格式

```java
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

LocalDateTime now = LocalDateTime.now();

// ISO 格式（默认）
System.out.println(now.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
// 2024-01-15T10:30:45.123

// 其他预定义格式
System.out.println(now.format(DateTimeFormatter.BASIC_ISO_DATE));
// 20240115

System.out.println(now.format(DateTimeFormatter.ISO_DATE));
// 2024-01-15

System.out.println(now.format(DateTimeFormatter.ISO_TIME));
// 10:30:45.123
```

### 自定义格式

```java
// 自定义格式模式
DateTimeFormatter customFormatter = DateTimeFormatter.ofPattern("yyyy年MM月dd日 HH:mm:ss");
String formatted = now.format(customFormatter);
System.out.println(formatted);  // 2024年01月15日 10:30:45

// 常用格式符号
// yyyy - 四位年份
// MM - 两位月份（01-12）
// dd - 两位日期（01-31）
// HH - 24小时制小时（00-23）
// hh - 12小时制小时（01-12）
// mm - 分钟（00-59）
// ss - 秒（00-59）
// SSS - 毫秒（000-999）
// E - 星期几（Mon、Tue等）
// a - AM/PM

// 更多示例
DateTimeFormatter formatter1 = DateTimeFormatter.ofPattern("yyyy/MM/dd");
System.out.println(now.format(formatter1));  // 2024/01/15

DateTimeFormatter formatter2 = DateTimeFormatter.ofPattern("MM-dd-yyyy HH:mm");
System.out.println(now.format(formatter2));  // 01-15-2024 10:30

DateTimeFormatter formatter3 = DateTimeFormatter.ofPattern("yyyy年MM月dd日 E a hh:mm");
System.out.println(now.format(formatter3));  // 2024年01月15日 星期一 上午 10:30
```

### 解析字符串

```java
// 从字符串解析日期时间
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy年MM月dd日 HH:mm:ss");
LocalDateTime parsed = LocalDateTime.parse("2024年01月15日 14:30:45", formatter);
System.out.println(parsed);  // 2024-01-15T14:30:45

// 解析日期
DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy/MM/dd");
LocalDate date = LocalDate.parse("2024/01/15", dateFormatter);
System.out.println(date);  // 2024-01-15

// 解析时间
DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");
LocalTime time = LocalTime.parse("14:30:45", timeFormatter);
System.out.println(time);  // 14:30:45
```

---

## 4 Duration 和 Period（时间间隔）

### Duration（时间间隔）

`Duration` 表示两个时间点之间的时间间隔，精确到纳秒。

```java
import java.time.Duration;
import java.time.LocalTime;
import java.time.LocalDateTime;

// 计算两个时间之间的间隔
LocalTime start = LocalTime.of(9, 0);
LocalTime end = LocalTime.of(17, 30);
Duration duration = Duration.between(start, end);

System.out.println("小时：" + duration.toHours());  // 8
System.out.println("分钟：" + duration.toMinutes());  // 510
System.out.println("秒：" + duration.getSeconds());  // 30600

// 创建 Duration
Duration twoHours = Duration.ofHours(2);
Duration thirtyMinutes = Duration.ofMinutes(30);
Duration total = twoHours.plus(thirtyMinutes);
System.out.println("总分钟：" + total.toMinutes());  // 150

// 时间加减
LocalTime now = LocalTime.of(10, 30);
LocalTime later = now.plus(Duration.ofHours(2));
System.out.println("2小时后：" + later);  // 12:30
```

### Period（日期间隔）

`Period` 表示两个日期之间的间隔，以年、月、日为单位。

```java
import java.time.Period;
import java.time.LocalDate;

// 计算两个日期之间的间隔
LocalDate startDate = LocalDate.of(2020, 1, 1);
LocalDate endDate = LocalDate.of(2024, 1, 15);
Period period = Period.between(startDate, endDate);

System.out.println("年：" + period.getYears());  // 4
System.out.println("月：" + period.getMonths());  // 0
System.out.println("日：" + period.getDays());  // 14

// 创建 Period
Period oneYear = Period.ofYears(1);
Period sixMonths = Period.ofMonths(6);
Period total = oneYear.plus(sixMonths);
System.out.println("总月数：" + (total.getYears() * 12 + total.getMonths()));  // 18

// 日期加减
LocalDate today = LocalDate.now();
LocalDate nextWeek = today.plus(Period.ofDays(7));
LocalDate nextMonth = today.plus(Period.ofMonths(1));
System.out.println("下周：" + nextWeek);
System.out.println("下个月：" + nextMonth);

// 计算年龄
LocalDate birthday = LocalDate.of(2000, 5, 20);
LocalDate now = LocalDate.now();
Period age = Period.between(birthday, now);
System.out.println("年龄：" + age.getYears() + "岁");
```

### Duration vs Period

| 特性 | Duration | Period |
|------|----------|--------|
| 适用对象 | 时间（LocalTime、LocalDateTime） | 日期（LocalDate） |
| 单位 | 纳秒、秒、分钟、小时 | 年、月、日 |
| 精度 | 精确到纳秒 | 精确到天 |
| 使用场景 | 计算时间间隔 | 计算日期间隔 |

---

## 5 时区处理

### ZoneId 和 ZonedDateTime

`ZonedDateTime` 表示带时区的日期时间。

```java
import java.time.ZoneId;
import java.time.ZonedDateTime;

// 获取所有可用时区
ZoneId.getAvailableZoneIds().stream()
    .filter(id -> id.contains("Asia"))
    .forEach(System.out::println);
// Asia/Shanghai
// Asia/Tokyo
// Asia/Hong_Kong
// ...

// 获取当前时区的日期时间
ZonedDateTime nowInShanghai = ZonedDateTime.now(ZoneId.of("Asia/Shanghai"));
System.out.println("上海时间：" + nowInShanghai);
// 2024-01-15T10:30:45.123+08:00[Asia/Shanghai]

ZonedDateTime nowInTokyo = ZonedDateTime.now(ZoneId.of("Asia/Tokyo"));
System.out.println("东京时间：" + nowInTokyo);
// 2024-01-15T11:30:45.123+09:00[Asia/Tokyo]

ZonedDateTime nowInNewYork = ZonedDateTime.now(ZoneId.of("America/New_York"));
System.out.println("纽约时间：" + nowInNewYork);
// 2024-01-14T21:30:45.123-05:00[America/New_York]

// 创建带时区的日期时间
ZonedDateTime meeting = ZonedDateTime.of(2024, 1, 15, 14, 30, 0, 0, ZoneId.of("Asia/Shanghai"));
System.out.println("会议时间：" + meeting);

// 时区转换
ZonedDateTime shanghaiTime = ZonedDateTime.now(ZoneId.of("Asia/Shanghai"));
ZonedDateTime tokyoTime = shanghaiTime.withZoneSameInstant(ZoneId.of("Asia/Tokyo"));
System.out.println("上海：" + shanghaiTime);
System.out.println("东京：" + tokyoTime);
```

### OffsetDateTime

`OffsetDateTime` 表示带时区偏移的日期时间（不包含时区规则）。

```java
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

// 创建带偏移的日期时间
OffsetDateTime offsetDateTime = OffsetDateTime.of(2024, 1, 15, 10, 30, 0, 0, ZoneOffset.ofHours(8));
System.out.println(offsetDateTime);  // 2024-01-15T10:30+08:00

// UTC 时间
OffsetDateTime utcTime = OffsetDateTime.now(ZoneOffset.UTC);
System.out.println("UTC时间：" + utcTime);
```

---

## 6 日期时间计算实战

### 计算工作日

```java
import java.time.LocalDate;
import java.time.DayOfWeek;

public class WorkdayCalculator {
    // 计算两个日期之间的工作日数量
    public static long countWorkdays(LocalDate start, LocalDate end) {
        long workdays = 0;
        LocalDate current = start;
        
        while (current.isBefore(end) || current.isEqual(end)) {
            DayOfWeek dayOfWeek = current.getDayOfWeek();
            if (dayOfWeek != DayOfWeek.SATURDAY && dayOfWeek != DayOfWeek.SUNDAY) {
                workdays++;
            }
            current = current.plusDays(1);
        }
        
        return workdays;
    }
    
    public static void main(String[] args) {
        LocalDate start = LocalDate.of(2024, 1, 1);
        LocalDate end = LocalDate.of(2024, 1, 31);
        long workdays = countWorkdays(start, end);
        System.out.println("2024年1月工作日数量：" + workdays);
    }
}
```

### 计算年龄

```java
import java.time.LocalDate;
import java.time.Period;

public class AgeCalculator {
    public static int calculateAge(LocalDate birthday) {
        LocalDate now = LocalDate.now();
        Period period = Period.between(birthday, now);
        return period.getYears();
    }
    
    public static void main(String[] args) {
        LocalDate birthday = LocalDate.of(2000, 5, 20);
        int age = calculateAge(birthday);
        System.out.println("出生日期：" + birthday);
        System.out.println("年龄：" + age + "岁");
    }
}
```

### 判断是否为闰年

```java
import java.time.LocalDate;

public class LeapYearChecker {
    public static boolean isLeapYear(int year) {
        return LocalDate.of(year, 1, 1).isLeapYear();
    }
    
    public static void main(String[] args) {
        System.out.println("2024年是闰年：" + isLeapYear(2024));  // true
        System.out.println("2023年是闰年：" + isLeapYear(2023));  // false
        System.out.println("2000年是闰年：" + isLeapYear(2000));  // true
        System.out.println("1900年是闰年：" + isLeapYear(1900));  // false
    }
}
```

---

## 7 与旧 API 的转换

### Date 与 LocalDateTime 互转

```java
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

// Date 转 LocalDateTime
Date date = new Date();
LocalDateTime localDateTime = date.toInstant()
    .atZone(ZoneId.systemDefault())
    .toLocalDateTime();
System.out.println("LocalDateTime：" + localDateTime);

// LocalDateTime 转 Date
LocalDateTime now = LocalDateTime.now();
Date convertedDate = Date.from(now.atZone(ZoneId.systemDefault()).toInstant());
System.out.println("Date：" + convertedDate);
```

### Calendar 与 LocalDate 互转

```java
import java.time.LocalDate;
import java.util.Calendar;
import java.util.GregorianCalendar;

// Calendar 转 LocalDate
Calendar calendar = Calendar.getInstance();
LocalDate localDate = LocalDate.of(
    calendar.get(Calendar.YEAR),
    calendar.get(Calendar.MONTH) + 1,  // Calendar 月份从 0 开始
    calendar.get(Calendar.DAY_OF_MONTH)
);
System.out.println("LocalDate：" + localDate);

// LocalDate 转 Calendar
LocalDate today = LocalDate.now();
Calendar convertedCalendar = GregorianCalendar.from(
    today.atStartOfDay(ZoneId.systemDefault())
);
System.out.println("Calendar：" + convertedCalendar.getTime());
```

---

## 8 新手常见误区

### 误区 1：使用旧 API

**错！** 新项目应该使用 Java 8+ 的日期时间 API。

```java
// ❌ 错误：使用旧 API
Date date = new Date();
Calendar calendar = Calendar.getInstance();

// ✅ 正确：使用新 API
LocalDate date = LocalDate.now();
LocalDateTime dateTime = LocalDateTime.now();
```

### 误区 2：忽略时区

**注意！** 如果应用涉及多个时区，必须正确处理时区。

```java
// ❌ 错误：忽略时区
LocalDateTime now = LocalDateTime.now();  // 系统默认时区

// ✅ 正确：明确指定时区
ZonedDateTime now = ZonedDateTime.now(ZoneId.of("Asia/Shanghai"));
```

### 误区 3：使用字符串拼接格式化

**错！** 应该使用 DateTimeFormatter。

```java
// ❌ 错误：字符串拼接
LocalDate date = LocalDate.now();
String formatted = date.getYear() + "-" + date.getMonthValue() + "-" + date.getDayOfMonth();

// ✅ 正确：使用 DateTimeFormatter
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
String formatted = date.format(formatter);
```

### 误区 4：混淆 Duration 和 Period

**注意！** Duration 用于时间，Period 用于日期。

```java
// ❌ 错误：用 Duration 计算日期间隔
LocalDate date1 = LocalDate.of(2024, 1, 1);
LocalDate date2 = LocalDate.of(2024, 2, 1);
// Duration duration = Duration.between(date1, date2);  // 编译错误

// ✅ 正确：用 Period 计算日期间隔
Period period = Period.between(date1, date2);
System.out.println("间隔：" + period.getDays() + "天");  // 31
```

### 误区 5：认为 LocalDateTime 包含时区

**注意！** LocalDateTime 不包含时区信息。

```java
// LocalDateTime 不包含时区
LocalDateTime now = LocalDateTime.now();
// 2024-01-15T10:30:45.123（没有时区信息）

// 如果需要时区，使用 ZonedDateTime
ZonedDateTime zonedDateTime = ZonedDateTime.now();
// 2024-01-15T10:30:45.123+08:00[Asia/Shanghai]（包含时区信息）
```

---

## 9 动手练习

### 练习 1：基础练习 —— 日期格式化

编写程序，将当前日期格式化为"yyyy年MM月dd日 星期E"的格式。

<details>
<summary>点击查看答案</summary>

```java
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class DateFormatter {
    public static void main(String[] args) {
        LocalDate today = LocalDate.now();
        
        // 使用中文 Locale
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy年MM月dd日 EEEE", Locale.CHINESE);
        String formatted = today.format(formatter);
        
        System.out.println("今天：" + formatted);
        // 输出：今天：2024年01月15日 星期一
    }
}
```

</details>

### 练习 2：进阶练习 —— 倒计时计算器

编写程序，计算距离某个日期还有多少天。

<details>
<summary>点击查看答案</summary>

```java
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public class CountdownCalculator {
    public static void main(String[] args) {
        LocalDate today = LocalDate.now();
        LocalDate targetDate = LocalDate.of(2024, 10, 1);  // 国庆节
        
        long daysBetween = ChronoUnit.DAYS.between(today, targetDate);
        
        if (daysBetween > 0) {
            System.out.println("距离 2024年国庆节还有 " + daysBetween + " 天");
        } else if (daysBetween < 0) {
            System.out.println("2024年国庆节已经过去 " + (-daysBetween) + " 天");
        } else {
            System.out.println("今天是 2024年国庆节！");
        }
    }
}
```

</details>

### 练习 3（挑战）：综合练习 —— 会议时间转换器

编写程序，将会议时间从上海时区转换为东京和纽约时区。

<details>
<summary>点击查看答案</summary>

```java
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public class MeetingTimeConverter {
    public static void main(String[] args) {
        // 假设会议在上海时间 2024-01-15 14:30
        ZonedDateTime shanghaiTime = ZonedDateTime.of(
            2024, 1, 15, 14, 30, 0, 0, ZoneId.of("Asia/Shanghai")
        );
        
        // 转换为东京时间
        ZonedDateTime tokyoTime = shanghaiTime.withZoneSameInstant(ZoneId.of("Asia/Tokyo"));
        
        // 转换为纽约时间
        ZonedDateTime newYorkTime = shanghaiTime.withZoneSameInstant(ZoneId.of("America/New_York"));
        
        // 格式化输出
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        
        System.out.println("上海时间：" + shanghaiTime.format(formatter));
        System.out.println("东京时间：" + tokyoTime.format(formatter));
        System.out.println("纽约时间：" + newYorkTime.format(formatter));
    }
}
```

</details>

---

## 10 核心知识点

| 知识点 | 说明 |
|--------|------|
| LocalDate | 表示日期（年-月-日），不包含时间和时区 |
| LocalTime | 表示时间（时:分:秒），不包含日期和时区 |
| LocalDateTime | 表示日期时间，不包含时区 |
| DateTimeFormatter | 格式化和解析日期时间 |
| Duration | 表示时间间隔，精确到纳秒 |
| Period | 表示日期间隔，以年、月、日为单位 |
| ZonedDateTime | 表示带时区的日期时间 |
| 不可变性 | 新 API 的所有类都是不可变的，线程安全 |

---

## 下一章预告

下一章我们会学习 **面向对象编程基础**——Java 最核心的编程思想。你会学到类与对象、构造器、封装、this 和 static 关键字。

---

## 本章小结

Java 8 引入了全新的日期时间 API，解决了旧 API 的所有问题。LocalDate、LocalTime、LocalDateTime 分别表示日期、时间和日期时间。DateTimeFormatter 用于格式化和解析。Duration 和 Period 用于计算时间间隔。ZonedDateTime 用于处理时区。新 API 是不可变的、线程安全的、设计清晰的。接下来我们将学习面向对象基础。
