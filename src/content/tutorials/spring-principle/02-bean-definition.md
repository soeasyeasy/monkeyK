---
title: "第 2 章：BeanDefinition 深度解析"
description: "深入理解 BeanDefinition 的数据结构、注册流程以及三种配置方式的解析原理"
---

# 第 2 章：BeanDefinition 深度解析

## 本章导读

在学这一章之前，你可能会有这些疑问：

- BeanDefinition 到底包含了哪些信息？它和 Bean 实例是什么关系？
- Spring 是怎么把 XML、注解、JavaConfig 这些配置变成 BeanDefinition 的？
- 为什么 Spring 要设计这么多层 BeanDefinition 接口？
- BeanDefinition 的注册和合并流程是怎样的？

这一章就是为了解答这些问题。我们会从源码层面，搞清楚 **BeanDefinition 的完整结构和解析流程**，让你理解 Spring 是如何把各种配置统一抽象为 BeanDefinition 的。

学完本章，你将能够：
- 清楚说出 BeanDefinition 的完整数据结构和继承体系
- 理解 XML、注解、JavaConfig 三种配置的解析原理
- 掌握 BeanDefinitionReader 的工作流程
- 能够自定义 BeanDefinition 实现动态 Bean 注册

---

## 1 为什么需要 BeanDefinition？

### 痛点分析

想象你是一个餐厅老板，你要管理 100 道菜。如果没有"菜谱系统"，你得：
1. 每道菜都记住所有细节（食材、做法、口味、摆盘）
2. 每次有人点菜，从头开始做
3. 想改个配方，得在脑子里记住所有改动

```java
// 没有 BeanDefinition 时的做法 - 直接操作对象
public class BadContainer {
    private Map<String, Object> beans = new HashMap<>();
    
    // 问题：只能存已经创建好的对象
    public void addBean(String name, Object bean) {
        beans.put(name, bean);
    }
    
    // 问题：无法知道 Bean 的元数据
    // - 这个 Bean 是什么类？
    // - 是单例还是原型？
    // - 依赖了哪些其他 Bean？
    // - 初始化方法是什么？
    // 这些信息全都丢失了！
}
```

**问题很明显**：
- 无法延迟创建对象（只能存已经 new 好的）
- 无法知道 Bean 的元数据（类名、作用域、依赖关系等）
- 无法在容器启动阶段做各种检查和优化
- 无法支持不同的配置方式（XML、注解等）

### 解决方案：BeanDefinition

有了 BeanDefinition，就像有了"菜谱管理系统"：
1. 先记录每道菜的"菜谱"（BeanDefinition）
2. 需要的时候根据"菜谱"做菜（创建 Bean 实例）
3. 想改配方？改"菜谱"就行，不用重新做菜

```java
// 有 BeanDefinition 后的做法 - 先记录元数据
public class GoodContainer {
    // 存储 Bean 的"元数据"（菜谱）
    private Map<String, BeanDefinition> beanDefinitions = new HashMap<>();
    // 存储 Bean 的"实例"（做好的菜）
    private Map<String, Object> beanInstances = new HashMap<>();
    
    // 注册 Bean 定义（记录菜谱）
    public void registerBeanDefinition(String name, BeanDefinition bd) {
        beanDefinitions.put(name, bd);
    }
    
    // 获取 Bean 实例（根据菜谱做菜）
    public Object getBean(String name) {
        // 如果已经创建过，直接返回
        if (beanInstances.containsKey(name)) {
            return beanInstances.get(name);
        }
        // 否则根据 BeanDefinition 创建
        BeanDefinition bd = beanDefinitions.get(name);
        Object bean = createBean(bd);
        beanInstances.put(name, bean);
        return bean;
    }
}
```

> **一句话总结**：BeanDefinition 是 Bean 的"元数据描述"，Spring 通过它来了解和管理每一个 Bean。

---

## 2 核心原理：BeanDefinition 数据结构

### BeanDefinition 接口体系

BeanDefinition 不是一个简单的类，而是一套完整的接口体系：

```
BeanDefinition（接口）
├── AttributeAccessor（属性访问）
├── BeanDefinitionMetadata（元数据读取）
│
├── AbstractBeanDefinition（抽象基类）
│   ├── RootBeanDefinition（合并后的最终定义）
│   ├── ChildBeanDefinition（子定义，继承父定义）
│   └── GenericBeanDefinition（通用定义，最常用）
│
└── AnnotatedBeanDefinition（注解 Bean 定义）
    ├── AnnotatedGenericBeanDefinition（@Configuration 类）
    └── ScannedGenericBeanDefinition（@Component 扫描到的）
```

### 源码解析：BeanDefinition 核心接口

```java
// BeanDefinition 核心接口
public interface BeanDefinition extends AttributeAccessor, BeanDefinitionMetadata {
    
    // ============ 作用域常量 ============
    // 单例作用域（默认）
    String SCOPE_SINGLETON = "singleton";
    // 原型作用域
    String SCOPE_PROTOTYPE = "prototype";
    
    // ============ 角色常量 ============
    // 应用 Bean（用户定义的）
    int ROLE_APPLICATION = 0;
    // 支持 Bean（内部使用的）
    int ROLE_SUPPORT = 1;
    // 基础设施 Bean（容器级别的）
    int ROLE_INFRASTRUCTURE = 2;
    
    // ============ 核心方法 ============
    // 设置父 Bean 名称
    void setParentName(String name);
    String getParentName();
    
    // 设置 Bean 类名
    void setBeanClassName(String beanClassName);
    String getBeanClassName();
    
    // 设置工厂 Bean 名称
    void setFactoryBeanName(String factoryBeanName);
    String getFactoryBeanName();
    
    // 设置工厂方法名称
    void setFactoryMethodName(String factoryMethodName);
    String getFactoryMethodName();
    
    // 设置作用域
    void setScope(String scope);
    String getScope();
    
    // 设置是否懒加载
    void setLazyInit(boolean lazyInit);
    boolean isLazyInit();
    
    // 获取依赖的 Bean 名称
    void setDependsOn(String... dependsOn);
    String[] getDependsOn();
    
    // 设置是否自动装配候选
    void setAutowireCandidate(boolean autowireCandidate);
    boolean isAutowireCandidate();
    
    // 设置是否主候选
    void setPrimary(boolean primary);
    boolean isPrimary();
    
    // 获取构造器参数
    ConstructorArgumentValues getConstructorArgumentValues();
    boolean hasConstructorArgumentValues();
    
    // 获取属性值
    MutablePropertyValues getPropertyValues();
    boolean hasPropertyValues();
    
    // 设置初始化方法名
    void setInitMethodName(String initMethodName);
    String getInitMethodName();
    
    // 设置销毁方法名
    void setDestroyMethodName(String destroyMethodName);
    String getDestroyMethodName();
    
    // ============ 推断模式 ============
    // 推断构造器模式
    void setAutowireMode(int autowireMode);
    int getAutowireMode();
    
    // 推断依赖检查模式
    void setDependencyCheck(int dependencyCheck);
    int getDependencyCheck();
    
    // 是否抽象（不能直接实例化）
    void setAbstract(boolean abstractFlag);
    boolean isAbstract();
}
```

### AbstractBeanDefinition：核心抽象基类

```java
// AbstractBeanDefinition 是大多数 BeanDefinition 的基类
public abstract class AbstractBeanDefinition implements BeanDefinition, Cloneable {
    
    // ============ 自动装配模式 ============
    // 不自动装配
    public static final int AUTOWIRE_NO = 0;
    // 按名称自动装配
    public static final int AUTOWIRE_BY_NAME = 1;
    // 按类型自动装配
    public static final int AUTOWIRE_BY_TYPE = 2;
    // 构造器自动装配
    public static final int AUTOWIRE_CONSTRUCTOR = 3;
    
    // ============ 核心字段 ============
    // Bean 类（如果可以直接访问的话）
    private volatile Object beanClass;
    
    // 作用域
    private String scope = SCOPE_DEFAULT;
    
    // 是否抽象
    private boolean abstractFlag = false;
    
    // 是否懒加载
    private boolean lazyInit = false;
    
    // 构造器参数
    private ConstructorArgumentValues constructorArgumentValues;
    
    // 属性值
    private MutablePropertyValues propertyValues;
    
    // 方法覆盖
    private MethodOverrides methodOverrides;
    
    // 工厂 Bean 名称
    private String factoryBeanName;
    // 工厂方法名称
    private String factoryMethodName;
    
    // 初始化方法名
    private String initMethodName;
    // 销毁方法名
    private String destroyMethodName;
    
    // 是否强制执行初始化
    private boolean enforceInitMethod = true;
    
    // 自动装配模式
    private int autowireMode = AUTOWIRE_NO;
    // 依赖检查模式
    private int dependencyCheck = DEPENDENCY_CHECK_NONE;
    
    // 依赖的 Bean 名称
    private String[] dependsOn;
    // 是否自动装配候选
    private boolean autowireCandidate = true;
    // 自动装配限定符
    private AutowireCandidateQualifier autowireCandidateQualifier;
    
    // 是否主候选
    private boolean primary = false;
    
    // 资源描述
    private String resourceDescription;
    // 来源（用于调试）
    private Object source;
    
    // ============ 核心方法 ============
    
    // 验证 BeanDefinition 是否有效
    public void validate() throws BeanDefinitionValidationException {
        // 检查方法覆盖
        if (hasMethodOverrides()) {
            if (getFactoryMethodName() != null) {
                throw new BeanDefinitionValidationException(
                    "Cannot combine factory method with method overrides");
            }
        }
    }
    
    // 获取解析后的 Bean 类
    public Class<?> resolveBeanClass(ClassLoader classLoader) throws ClassNotFoundException {
        String className = getBeanClassName();
        if (className == null) {
            return null;
        }
        Class<?> resolvedClass = ClassUtils.forName(className, classLoader);
        this.beanClass = resolvedClass;
        return resolvedClass;
    }
    
    // 是否有构造器参数
    public boolean hasConstructorArgumentValues() {
        return (this.constructorArgumentValues != null &&
                !this.constructorArgumentValues.isEmpty());
    }
    
    // 获取构造器参数（懒加载创建）
    public ConstructorArgumentValues getConstructorArgumentValues() {
        if (this.constructorArgumentValues == null) {
            this.constructorArgumentValues = new ConstructorArgumentValues();
        }
        return this.constructorArgumentValues;
    }
    
    // 是否有属性值
    public boolean hasPropertyValues() {
        return (this.propertyValues != null && !this.propertyValues.isEmpty());
    }
    
    // 获取属性值（懒加载创建）
    public MutablePropertyValues getPropertyValues() {
        if (this.propertyValues == null) {
            this.propertyValues = new MutablePropertyValues();
        }
        return this.propertyValues;
    }
}
```

### 三种具体的 BeanDefinition

```java
// 1. RootBeanDefinition - 合并后的最终 BeanDefinition
// 用于容器内部，是 BeanDefinition 的最终形态
public class RootBeanDefinition extends AbstractBeanDefinition {
    // 目标类型（用于推断）
    private volatile Class<?> targetType;
    // 推断的构造器/工厂方法
    volatile ResolvableConstructorOrMethod resolvedConstructorOrFactoryMethod;
    // 是否已标记为"非公共"
    private boolean nonPublicAccessAllowed = true;
    
    // 重要：合并子定义和父定义
    public void overrideFrom(BeanDefinition other) {
        // 从其他 BeanDefinition 复制属性
        if (other instanceof AbstractBeanDefinition) {
            AbstractBeanDefinition otherBd = (AbstractBeanDefinition) other;
            // 复制所有属性...
        }
    }
}

// 2. ChildBeanDefinition - 子 BeanDefinition（继承父定义）
public class ChildBeanDefinition extends AbstractBeanDefinition {
    // 父 Bean 名称
    private String parentName;
    
    public ChildBeanDefinition(String parentName) {
        this.parentName = parentName;
    }
    
    public ChildBeanDefinition(String parentName, String beanClassName) {
        this.parentName = parentName;
        setBeanClassName(beanClassName);
    }
}

// 3. GenericBeanDefinition - 通用 BeanDefinition（最常用）
// 可以设置父名称，也可以独立使用
public class GenericBeanDefinition extends AbstractBeanDefinition {
    // 父 Bean 名称
    private String parentName;
    
    @Override
    public String getParentName() {
        return this.parentName;
    }
    
    @Override
    public void setParentName(String parentName) {
        this.parentName = parentName;
    }
}
```

> **生活化类比**：
> - `RootBeanDefinition` 就像"最终版菜谱"，所有信息都完整了
> - `ChildBeanDefinition` 就像"子菜谱"，继承自"父菜谱"，只记录差异部分
> - `GenericBeanDefinition` 就像"通用菜谱模板"，可以独立使用，也可以作为模板

### 注解相关的 BeanDefinition

```java
// 注解 BeanDefinition 接口
public interface AnnotatedBeanDefinition extends BeanDefinition {
    // 获取注解元数据
    AnnotationMetadata getMetadata();
    // 获取工厂方法元数据
    MethodMetadata getFactoryMethodMetadata();
}

// 配置类的 BeanDefinition（@Configuration）
public class AnnotatedGenericBeanDefinition extends GenericBeanDefinition 
    implements AnnotatedBeanDefinition {
    
    // 注解元数据
    private final AnnotationMetadata metadata;
    // 资源位置
    private Resource resource;
    
    public AnnotatedGenericBeanDefinition(Class<?> beanClass) {
        setBeanClass(beanClass);
        // 通过 ASM 或反射获取注解信息
        this.metadata = AnnotationMetadata.introspect(beanClass);
    }
}

// 扫描到的 BeanDefinition（@Component）
public class ScannedGenericBeanDefinition extends GenericBeanDefinition 
    implements AnnotatedBeanDefinition {
    
    // 资源
    private final Resource resource;
    // 注解元数据
    private final AnnotationMetadata metadata;
    
    public ScannedGenericBeanDefinition(Resource resource) {
        this.resource = resource;
        // 通过 ASM 读取类上的注解信息
        this.metadata = new SimpleAnnotationMetadataReadingVisitor(resource);
    }
}
```

---

## 3 三种配置方式的解析原理

### 整体架构：BeanDefinitionReader 体系

```
BeanDefinitionReader（接口）
├── XmlBeanDefinitionReader - 解析 XML 配置
├── PropertiesBeanDefinitionReader - 解析 Properties 配置
└── AnnotatedBeanDefinitionReader - 解析注解配置

BeanDefinitionDocumentReader（接口）
└── DefaultBeanDefinitionDocumentReader
    ├── 解析 <bean> 元素
    ├── 解析 <import> 元素
    └── 解析 <alias> 元素

BeanDefinitionParser（接口）
└── 各种自定义解析器
```

### 2.3.1 XML 配置解析原理

#### 解析流程

```java
// XML 解析的入口
public class XmlBeanDefinitionReader extends AbstractBeanDefinitionReader {
    
    // 核心方法：从 Resource 加载 BeanDefinition
    public int loadBeanDefinitions(Resource resource) throws BeanDefinitionStoreException {
        return loadBeanDefinitions(new EncodedResource(resource));
    }
    
    // 实际的加载逻辑
    public int loadBeanDefinitions(EncodedResource encodedResource) throws BeanDefinitionStoreException {
        // 1. 获取输入流
        InputStream inputStream = encodedResource.getResource().getInputStream();
        
        try {
            // 2. 创建 XML 输入源
            InputSource inputSource = new InputSource(inputStream);
            
            // 3. 调用核心方法：解析 XML 文档
            return doLoadBeanDefinitions(inputSource, encodedResource.getResource());
        } finally {
            inputStream.close();
        }
    }
    
    // 核心：解析 XML 文档
    protected int doLoadBeanDefinitions(InputSource inputSource, Resource resource) 
        throws BeanDefinitionStoreException {
        
        // 1. 读取 XML 文档为 DOM 树
        Document doc = doLoadDocument(inputSource, resource);
        
        // 2. 注册 BeanDefinition
        return registerBeanDefinitions(doc, resource);
    }
    
    // 注册 BeanDefinition
    public int registerBeanDefinitions(Document doc, Resource resource) 
        throws BeanDefinitionStoreException {
        
        // 创建 BeanDefinitionDocumentReader
        BeanDefinitionDocumentReader documentReader = createBeanDefinitionDocumentReader();
        
        // 获取 BeanDefinition 注册数量
        int countBefore = getRegistry().getBeanDefinitionCount();
        
        // 核心：让 DocumentReader 解析 DOM 文档
        documentReader.registerBeanDefinitions(doc, createReaderContext(resource));
        
        // 返回新注册的 BeanDefinition 数量
        return getRegistry().getBeanDefinitionCount() - countBefore;
    }
}
```

#### DocumentReader 解析过程

```java
// DefaultBeanDefinitionDocumentReader 解析 DOM 文档
public class DefaultBeanDefinitionDocumentReader implements BeanDefinitionDocumentReader {
    
    // 注册 BeanDefinition
    public void registerBeanDefinitions(Document doc, XmlReaderContext readerContext) {
        Element root = doc.getDocumentElement();
        doRegisterBeanDefinitions(root);
    }
    
    protected void doRegisterBeanDefinitions(Element root) {
        // 1. 处理 profile 属性
        String profileSpec = root.getAttribute(PROFILE_ATTRIBUTE);
        if (StringUtils.hasText(profileSpec)) {
            // 检查当前环境是否匹配
            if (!getReaderContext().getEnvironment().acceptsProfiles(profileSpec)) {
                return;
            }
        }
        
        // 2. 预处理（留给子类扩展）
        preProcessXml(root);
        
        // 3. 解析所有子元素
        parseBeanDefinitions(root, getDelegate(root));
        
        // 4. 后处理（留给子类扩展）
        postProcessXml(root);
    }
    
    // 解析 Bean 定义元素
    protected void parseBeanDefinitions(Element root, BeanDefinitionParserDelegate delegate) {
        // 检查是否是 Spring beans 命名空间
        if (delegate.isDefaultNamespace(root)) {
            NodeList nl = root.getChildNodes();
            for (int i = 0; i < nl.getLength(); i++) {
                Node node = nl.item(i);
                if (node instanceof Element) {
                    Element ele = (Element) node;
                    if (delegate.isDefaultNamespace(ele)) {
                        // 解析默认命名空间的元素
                        parseDefaultElement(ele, delegate);
                    } else {
                        // 解析自定义命名空间的元素
                        delegate.parseCustomElement(ele);
                    }
                }
            }
        } else {
            delegate.parseCustomElement(root);
        }
    }
    
    // 解析默认元素（<bean>、<import>、<alias> 等）
    private void parseDefaultElement(Element ele, BeanDefinitionParserDelegate delegate) {
        if (delegate.nodeNameEquals(ele, BEAN_ELEMENT)) {
            // 1. 解析 <bean> 元素
            BeanDefinitionHolder bdHolder = delegate.parseBeanDefinitionElement(ele);
            if (bdHolder != null) {
                // 处理子元素（<property>、<constructor-arg> 等）
                bdHolder = delegate.decorateBeanDefinitionIfRequired(ele, bdHolder);
                // 注册 BeanDefinition
                registerBeanDefinition(bdHolder, getReaderContext().getRegistry());
            }
        } else if (delegate.nodeNameEquals(ele, IMPORT_ELEMENT)) {
            // 2. 解析 <import> 元素
            String location = ele.getAttribute(RESOURCE_ATTRIBUTE);
            getReaderContext().getReader().loadBeanDefinitions(location);
        } else if (delegate.nodeNameEquals(ele, ALIAS_ELEMENT)) {
            // 3. 解析 <alias> 元素
            String name = ele.getAttribute(NAME_ATTRIBUTE);
            String alias = ele.getAttribute(ALIAS_ATTRIBUTE);
            getReaderContext().getRegistry().registerAlias(name, alias);
        } else if (delegate.isDefaultNamespace(ele)) {
            // 4. 解析其他默认元素（<beans> 等）
            delegate.parseDefaultElement(ele, delegate);
        }
    }
}
```

#### 解析 <bean> 元素

```java
// BeanDefinitionParserDelegate 解析 <bean> 元素
public class BeanDefinitionParserDelegate {
    
    public BeanDefinitionHolder parseBeanDefinitionElement(Element ele) {
        return parseBeanDefinitionElement(ele, null);
    }
    
    public BeanDefinitionHolder parseBeanDefinitionElement(Element ele, BeanDefinition containingBean) {
        // 1. 获取 id 和 name 属性
        String id = ele.getAttribute(ID_ATTRIBUTE);
        String nameAttr = ele.getAttribute(NAME_ATTRIBUTE);
        
        // 2. 解析别名
        List<String> aliases = new ArrayList<>();
        if (StringUtils.hasLength(nameAttr)) {
            String[] nameArr = StringUtils.tokenizeToStringArray(nameAttr, MULTI_VALUE_ATTRIBUTE_DELIMITERS);
            aliases.addAll(Arrays.asList(nameArr));
        }
        
        // 3. 确定 Bean 名称
        String beanName = id;
        if (!StringUtils.hasText(beanName) && !aliases.isEmpty()) {
            beanName = aliases.remove(0);
        }
        if (beanName == null) {
            // 自动生成名称
            beanName = generateBeanName(ele, containingBean);
        }
        
        // 4. 创建 BeanDefinition
        AbstractBeanDefinition bd = createBeanDefinition(className, parent);
        
        // 5. 解析 BeanDefinition 属性
        parseBeanDefinitionAttributes(ele, beanName, containingBean, bd);
        
        // 6. 解析 <meta> 元素
        parseMetaElements(ele, bd);
        
        // 7. 解析 <lookup-method> 元素
        parseLookupOverrideSubElements(ele, bd.getMethodOverrides());
        
        // 8. 解析 <replaced-method> 元素
        parseReplacedMethodSubElements(ele, bd.getMethodOverrides());
        
        // 9. 解析 <constructor-arg> 元素
        parseConstructorArgElements(ele, bd);
        
        // 10. 解析 <property> 元素
        parsePropertyElements(ele, bd);
        
        // 11. 解析 qualifier 元素
        parseQualifierElements(ele, bd);
        
        // 12. 解析 init-method 和 destroy-method
        // 在 parseBeanDefinitionAttributes 中已处理
        
        return new BeanDefinitionHolder(bd, beanName, aliasesArray);
    }
    
    // 解析 BeanDefinition 的属性
    public AbstractBeanDefinition parseBeanDefinitionAttributes(Element ele, 
        String beanName, BeanDefinition containingBean, AbstractBeanDefinition bd) {
        
        // scope 属性
        String scope = ele.getAttribute(SCOPE_ATTRIBUTE);
        bd.setScope(scope);
        
        // abstract 属性
        String abstractAttr = ele.getAttribute(ABSTRACT_ATTRIBUTE);
        bd.setAbstract("true".equals(abstractAttr));
        
        // lazy-init 属性
        String lazyInit = ele.getAttribute(LAZY_INIT_ATTRIBUTE);
        bd.setLazyInit("true".equals(lazyInit));
        
        // autowire 属性
        String autowire = ele.getAttribute(AUTOWIRE_ATTRIBUTE);
        bd.setAutowireMode(resolveAutowireMode(autowire));
        
        // depends-on 属性
        String dependsOn = ele.getAttribute(DEPENDS_ON_ATTRIBUTE);
        bd.setDependsOn(StringUtils.tokenizeToStringArray(dependsOn, MULTI_VALUE_ATTRIBUTE_DELIMITERS));
        
        // autowire-candidate 属性
        String autowireCandidate = ele.getAttribute(AUTOWIRE_CANDIDATE_ATTRIBUTE);
        bd.setAutowireCandidate("true".equals(autowireCandidate));
        
        // primary 属性
        String primary = ele.getAttribute(PRIMARY_ATTRIBUTE);
        bd.setPrimary("true".equals(primary));
        
        // init-method 属性
        String initMethod = ele.getAttribute(INIT_METHOD_ATTRIBUTE);
        bd.setInitMethodName(initMethod);
        
        // destroy-method 属性
        String destroyMethod = ele.getAttribute(DESTROY_METHOD_ATTRIBUTE);
        bd.setDestroyMethodName(destroyMethod);
        
        return bd;
    }
}
```

> **生活化类比**：
> XML 解析就像"读菜谱书"：
> 1. 打开书（加载 XML 文件）
> 2. 解析目录结构（构建 DOM 树）
> 3. 逐个读取菜谱（解析 <bean> 元素）
> 4. 记录每道菜的细节（创建 BeanDefinition）
> 5. 把菜谱放入菜谱本（注册到容器）

### 2.3.2 注解配置解析原理

#### @ComponentScan 扫描流程

```java
// 注解扫描的核心类：ClassPathBeanDefinitionScanner
public class ClassPathBeanDefinitionScanner extends ClassPathScanningCandidateComponentProvider {
    
    // 扫描指定的包路径
    public int scan(String... basePackages) {
        int beanCountAtScanStart = getRegistry().getBeanDefinitionCount();
        
        // 1. 执行扫描
        doScan(basePackages);
        
        // 2. 注册注解配置的后处理器
        if (this.includeAnnotationConfig) {
            AnnotationConfigUtils.registerAnnotationConfigProcessors(getRegistry());
        }
        
        return getRegistry().getBeanDefinitionCount() - beanCountAtScanStart;
    }
    
    // 核心：扫描包并注册 BeanDefinition
    protected Set<BeanDefinitionHolder> doScan(String... basePackages) {
        Set<BeanDefinitionHolder> beanDefinitions = new LinkedHashSet<>();
        
        for (String basePackage : basePackages) {
            // 1. 查找候选组件
            Set<BeanDefinition> candidates = findCandidateComponents(basePackage);
            
            for (BeanDefinition candidate : candidates) {
                // 2. 解析 scope 注解
                ScopeMetadata scopeMetadata = resolveScopeMetadata(candidate);
                candidate.setScope(scopeMetadata.getScopeName());
                
                // 3. 生成 Bean 名称
                String beanName = determineBeanName(candidate);
                
                // 4. 创建 BeanDefinitionHolder
                BeanDefinitionHolder holder = new BeanDefinitionHolder(candidate, beanName);
                beanDefinitions.add(holder);
                
                // 5. 注册 BeanDefinition
                registerBeanDefinition(holder, getRegistry());
            }
        }
        
        return beanDefinitions;
    }
    
    // 查找候选组件
    public Set<BeanDefinition> findCandidateComponents(String basePackage) {
        // 如果支持索引（Spring 5.0+ 的组件索引）
        if (this.componentsIndex != null && indexSupportsIncludeFilters()) {
            return addCandidateComponentsFromIndex(this.componentsIndex, basePackage);
        } else {
            // 传统的类路径扫描
            return scanCandidateComponents(basePackage);
        }
    }
    
    // 扫描候选组件
    private Set<BeanDefinition> scanCandidateComponents(String basePackage) {
        Set<BeanDefinition> candidates = new LinkedHashSet<>();
        
        // 1. 构建包路径的资源模式
        String packageSearchPath = ResourcePatternResolver.CLASSPATH_ALL_URL_PREFIX +
            resolveBasePackage(basePackage) + '/' + this.resourcePattern;
        
        // 2. 扫描所有匹配的 .class 文件
        Resource[] resources = getResourcePatternResolver().getResources(packageSearchPath);
        
        for (Resource resource : resources) {
            if (resource.isReadable()) {
                try {
                    // 3. 使用 ASM 读取类的元数据（不加载类到 JVM）
                    MetadataReader metadataReader = getMetadataReaderFactory()
                        .getMetadataReader(resource);
                    
                    // 4. 检查是否是候选组件
                    if (isCandidateComponent(metadataReader)) {
                        // 5. 创建 ScannedGenericBeanDefinition
                        ScannedGenericBeanDefinition sbd = 
                            new ScannedGenericBeanDefinition(metadataReader);
                        sbd.setResource(resource);
                        sbd.setSource(resource);
                        
                        // 6. 检查是否是独立组件
                        if (isCandidateComponent(sbd)) {
                            candidates.add(sbd);
                        }
                    }
                } catch (Throwable ex) {
                    throw new BeanDefinitionStoreException("Failed to read candidate component", ex);
                }
            }
        }
        
        return candidates;
    }
}
```

#### 注解元数据读取

```java
// 使用 ASM 读取注解元数据（不需要加载类）
public class SimpleMetadataReader implements MetadataReader {
    
    // 资源
    private final Resource resource;
    // 类元数据
    private final ClassMetadata classMetadata;
    // 注解元数据
    private final AnnotationMetadata annotationMetadata;
    
    public SimpleMetadataReader(Resource resource, ClassLoader classLoader) throws IOException {
        // 使用 ASM 读取 class 文件
        SimpleAnnotationMetadataReadingVisitor visitor = new SimpleAnnotationMetadataReadingVisitor(classLoader);
        
        // ASM 的 ClassReader
        ClassReader classReader = new ClassReader(resource.getInputStream());
        classReader.accept(visitor, ClassReader.SKIP_DEBUG);
        
        this.classMetadata = visitor;
        this.annotationMetadata = visitor;
    }
}

// 注解元数据访问器
class SimpleAnnotationMetadataReadingVisitor extends ClassVisitor implements AnnotationMetadata {
    
    private final Set<String> annotationSet = new LinkedHashSet<>();
    private final Map<String, Map<String, Object>> attributeMap = new LinkedHashMap<>();
    
    @Override
    public AnnotationVisitor visitAnnotation(String descriptor, boolean visible) {
        // 记录类上的注解
        String annotationType = Type.getType(descriptor).getClassName();
        annotationSet.add(annotationType);
        return new SimpleAnnotationVisitor(annotationType);
    }
    
    // 检查是否有某个注解
    @Override
    public boolean hasAnnotation(String annotationName) {
        return this.annotationSet.contains(annotationName);
    }
    
    // 检查是否有 @Component 注解（包括元注解）
    @Override
    public boolean isAnnotated(String annotationName) {
        return this.annotationSet.contains(annotationName);
    }
}
```

> **生活化类比**：
> 注解扫描就像"仓库盘点"：
> 1. 拿到仓库地图（包路径）
> 2. 逐个货架检查（扫描 .class 文件）
> 3. 看标签找目标（检查 @Component 等注解）
> 4. 记录物品信息（创建 BeanDefinition）
> 5. 录入系统（注册到容器）

### 2.3.3 JavaConfig 配置解析原理

#### @Configuration 和 @Bean 的处理

```java
// ConfigurationClassPostProcessor 是处理 @Configuration 的核心
public class ConfigurationClassPostProcessor implements BeanDefinitionRegistryPostProcessor {
    
    @Override
    public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) {
        // 1. 处理所有的配置类
        processConfigBeanDefinitions(registry);
    }
    
    public void processConfigBeanDefinitions(BeanDefinitionRegistry registry) {
        List<BeanDefinitionHolder> configCandidates = new ArrayList<>();
        
        // 1. 找出所有的配置类（@Configuration 或 @Component）
        String[] existingDefs = registry.getBeanDefinitionNames();
        for (String beanName : existingDefs) {
            BeanDefinition bd = registry.getBeanDefinition(beanName);
            if (isConfigurationCandidate(bd)) {
                configCandidates.add(new BeanDefinitionHolder(bd, beanName));
            }
        }
        
        // 2. 创建配置类解析器
        ConfigurationClassParser parser = new ConfigurationClassParser(
            this.componentScanParser, this.conditionEvaluator, this.environment,
            this.resourceLoader, this.registry, this.metadataReaderFactory);
        
        // 3. 解析配置类
        Set<BeanDefinitionHolder> parsedConfigClasses = new LinkedHashSet<>();
        parser.parse(configCandidates.stream()
            .map(BeanDefinitionHolder::getBeanDefinition)
            .collect(Collectors.toSet()));
        
        // 4. 处理解析结果
        ConfigurationClassBeanDefinitionReader reader = 
            new ConfigurationClassBeanDefinitionReader(registry, this.componentScanParser,
                this.conditionEvaluator, this.importParser, this.resourceLoader);
        
        // 5. 加载 @Bean 方法定义的 Bean
        reader.loadBeanDefinitions(configCandidates);
    }
}

// 配置类解析器
class ConfigurationClassParser {
    
    // 解析配置类
    public void parse(Set<BeanDefinition> configCandidates) {
        for (BeanDefinition bd : configCandidates) {
            // 获取注解元数据
            AnnotationMetadata metadata;
            if (bd instanceof AnnotatedBeanDefinition) {
                metadata = ((AnnotatedBeanDefinition) bd).getMetadata();
            } else {
                metadata = getMetadataReader(bd).getAnnotationMetadata();
            }
            
            // 创建配置类
            ConfigurationClass configClass = new ConfigurationClass(metadata, bd.getBeanClassName());
            
            // 递归解析
            doProcessConfigurationClass(configClass, metadata);
        }
    }
    
    // 处理配置类
    protected SourceClass doProcessConfigurationClass(ConfigurationClass configClass, 
        AnnotationMetadata metadata) throws IOException {
        
        // 1. 处理 @PropertySource 注解
        processPropertySource(configClass, metadata);
        
        // 2. 处理 @ComponentScan 注解
        processComponentScan(configClass, metadata);
        
        // 3. 处理 @Import 注解
        processImports(configClass, metadata);
        
        // 4. 处理 @ImportResource 注解
        processImportResource(configClass, metadata);
        
        // 5. 处理 @Bean 方法 - 核心！
        processBeanMethods(configClass, metadata);
        
        // 6. 处理接口的默认方法（Java 8+）
        processInterfaces(configClass, metadata);
        
        // 7. 处理父类
        processParentClass(configClass, metadata);
        
        return configClass;
    }
    
    // 处理 @Bean 方法
    private void processBeanMethods(ConfigurationClass configClass, AnnotationMetadata metadata) {
        // 获取所有 @Bean 方法
        Set<MethodMetadata> beanMethods = metadata.getAnnotatedMethods(Bean.class.getName());
        
        for (MethodMetadata methodMetadata : beanMethods) {
            // 创建 BeanMethod 对象
            ConfigurationClassBeanMethod beanMethod = new ConfigurationClassBeanMethod(methodMetadata);
            
            // 添加到配置类中
            configClass.addBeanMethod(beanMethod);
        }
    }
}

// 配置类 BeanDefinition 读取器
class ConfigurationClassBeanDefinitionReader {
    
    // 加载 BeanDefinition
    public void loadBeanDefinitions(Set<ConfigurationClass> configurationModel) {
        for (ConfigurationClass configClass : configurationModel) {
            loadBeanDefinitionsForConfigurationClass(configClass);
        }
    }
    
    private void loadBeanDefinitionsForConfigurationClass(ConfigurationClass configClass) {
        // 1. 加载 @Bean 方法定义的 Bean
        for (ConfigurationClassBeanMethod beanMethod : configClass.getBeanMethods()) {
            loadBeanDefinitionsForBeanMethod(beanMethod, configClass);
        }
    }
    
    private void loadBeanDefinitionsForBeanMethod(ConfigurationClassBeanMethod beanMethod, 
        ConfigurationClass configClass) {
        
        // 1. 创建 BeanDefinition
        ConfigurationClassBeanDefinition beanDef = new ConfigurationClassBeanDefinition(beanMethod, configClass);
        
        // 2. 设置 Bean 类
        beanDef.setBeanClassName(configClass.getMetadata().getClassName());
        
        // 3. 设置工厂方法名（@Bean 方法名）
        beanDef.setFactoryMethodName(beanMethod.getMetadata().getMethodName());
        
        // 4. 设置自动装配模式
        beanDef.setAutowireMode(AbstractBeanDefinition.AUTOWIRE_CONSTRUCTOR);
        
        // 5. 处理方法参数（@Autowired 参数）
        // 获取方法参数类型，创建依赖
        MethodMetadata methodMetadata = beanMethod.getMetadata();
        // ... 解析参数类型并设置
        
        // 6. 处理 @Scope 注解
        Map<String, Object> scopeAttrs = methodMetadata.getAnnotationAttributes(Scope.class.getName());
        if (scopeAttrs != null) {
            beanDef.setScope((String) scopeAttrs.get("value"));
        }
        
        // 7. 处理 @Lazy 注解
        Map<String, Object> lazyAttrs = methodMetadata.getAnnotationAttributes(Lazy.class.getName());
        if (lazyAttrs != null) {
            beanDef.setLazyInit((Boolean) lazyAttrs.get("value"));
        }
        
        // 8. 注册 BeanDefinition
        String beanName = beanMethod.getMetadata().getMethodName();
        this.registry.registerBeanDefinition(beanName, beanDef);
    }
}
```

> **生活化类比**：
> JavaConfig 解析就像"按配方做菜"：
> 1. 找到配方书（@Configuration 类）
> 2. 读取每道菜的配方（@Bean 方法）
> 3. 记录食材和做法（创建 BeanDefinition）
> 4. 处理配菜关系（方法参数 = 依赖注入）
> 5. 把配方录入系统（注册 BeanDefinition）

---

## 4 基础用法：BeanDefinition 操作

### 手动注册 BeanDefinition

```java
import org.springframework.beans.factory.support.BeanDefinitionBuilder;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.beans.factory.config.BeanDefinition;

public class ManualBeanDefinitionDemo {
    public static void main(String[] args) {
        // 1. 创建 BeanFactory
        DefaultListableBeanFactory beanFactory = new DefaultListableBeanFactory();
        
        // 2. 使用 BeanDefinitionBuilder 构建 BeanDefinition
        BeanDefinitionBuilder builder = BeanDefinitionBuilder
            .genericBeanDefinition(UserService.class)  // 设置 Bean 类
            .setScope(BeanDefinition.SCOPE_SINGLETON)   // 设置作用域
            .setLazyInit(false)                         // 设置非懒加载
            .addPropertyValue("timeout", 3000)          // 设置属性值
            .addPropertyReference("userDao", "userDao") // 设置依赖引用
            .setInitMethodName("init")                  // 设置初始化方法
            .setDestroyMethodName("destroy");           // 设置销毁方法
        
        // 3. 获取构建好的 BeanDefinition
        BeanDefinition beanDefinition = builder.getBeanDefinition();
        
        // 4. 注册到 BeanFactory
        beanFactory.registerBeanDefinition("userService", beanDefinition);
        
        // 5. 注册依赖的 Bean
        BeanDefinition userDaoDef = BeanDefinitionBuilder
            .genericBeanDefinition(UserDao.class)
            .getBeanDefinition();
        beanFactory.registerBeanDefinition("userDao", userDaoDef);
        
        // 6. 获取 Bean（会触发创建和依赖注入）
        UserService userService = beanFactory.getBean("userService", UserService.class);
        System.out.println("Bean 创建成功: " + userService);
    }
}

// 被管理的类
class UserService {
    private UserDao userDao;
    private int timeout;
    
    // 必须有无参构造器（或 Spring 会使用其他构造器）
    public UserService() {
        System.out.println("UserService 构造方法");
    }
    
    public void setUserDao(UserDao userDao) {
        this.userDao = userDao;
    }
    
    public void setTimeout(int timeout) {
        this.timeout = timeout;
    }
    
    public void init() {
        System.out.println("UserService 初始化，timeout=" + timeout);
    }
    
    public void destroy() {
        System.out.println("UserService 销毁");
    }
}

class UserDao {
    public UserDao() {
        System.out.println("UserDao 构造方法");
    }
}
```

### 动态注册和移除 BeanDefinition

```java
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.beans.factory.support.BeanDefinitionBuilder;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;

public class DynamicBeanRegistrationDemo {
    public static void main(String[] args) {
        // 1. 创建容器
        AnnotationConfigApplicationContext context = 
            new AnnotationConfigApplicationContext(AppConfig.class);
        
        // 2. 获取内部的 BeanFactory
        DefaultListableBeanFactory beanFactory = 
            (DefaultListableBeanFactory) context.getBeanFactory();
        
        // 3. 动态注册 Bean
        BeanDefinition newBeanDef = BeanDefinitionBuilder
            .genericBeanDefinition(DynamicService.class)
            .addPropertyValue("name", "动态服务")
            .getBeanDefinition();
        
        beanFactory.registerBeanDefinition("dynamicService", newBeanDef);
        
        // 4. 获取动态注册的 Bean
        DynamicService service = context.getBean("dynamicService", DynamicService.class);
        System.out.println("动态 Bean: " + service.getName());
        
        // 5. 检查是否包含
        boolean contains = beanFactory.containsBeanDefinition("dynamicService");
        System.out.println("包含 dynamicService: " + contains);
        
        // 6. 移除 BeanDefinition
        beanFactory.removeBeanDefinition("dynamicService");
        System.out.println("移除后包含: " + beanFactory.containsBeanDefinition("dynamicService"));
    }
}

class DynamicService {
    private String name;
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
```

### 使用 BeanFactoryPostProcessor 修改 BeanDefinition

```java
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.beans.factory.config.BeanDefinitionPostProcessor;
import org.springframework.stereotype.Component;

// 修改 BeanDefinition 的后处理器
@Component
public class MyBeanFactoryPostProcessor implements BeanFactoryPostProcessor {
    
    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        // 1. 获取所有的 BeanDefinition 名称
        String[] beanNames = beanFactory.getBeanDefinitionNames();
        
        for (String beanName : beanNames) {
            // 2. 获取 BeanDefinition
            var bd = beanFactory.getBeanDefinition(beanName);
            
            // 3. 修改特定 Bean 的属性
            if ("userService".equals(beanName)) {
                // 修改作用域
                bd.setScope("prototype");
                
                // 添加属性值
                bd.getPropertyValues().add("timeout", 5000);
                
                // 修改初始化方法
                bd.setInitMethodName("customInit");
            }
            
            // 4. 给所有 Service 类添加通用属性
            if (bd.getBeanClassName() != null && 
                bd.getBeanClassName().endsWith("Service")) {
                bd.getPropertyValues().add("createdBy", "BeanFactoryPostProcessor");
            }
        }
    }
}
```

---

## 5 对比表格

### 三种配置方式对比

| 特性 | XML 配置 | 注解配置 | JavaConfig 配置 |
|------|---------|---------|----------------|
| 配置方式 | XML 文件 | @Component 等注解 | @Configuration + @Bean |
| 解析器 | XmlBeanDefinitionReader | ClassPathBeanDefinitionScanner | ConfigurationClassPostProcessor |
| 类型安全 | 否（字符串） | 是（编译时检查） | 是（编译时检查） |
| 灵活性 | 高（可动态修改 XML） | 中（需要重新编译） | 高（可用 Java 逻辑） |
| 可读性 | 中（标签较多） | 高（直接在类上） | 高（Java 代码） |
| 适用场景 | 传统项目、第三方 Bean | 自己开发的组件 | 复杂配置、第三方 Bean |
| 条件装配 | 不支持 | @Conditional | @Conditional + @Bean |
| 解析时机 | 容器启动时 | 扫描时 | refresh() 时 |
| 维护成本 | 高（配置分散） | 低（集中管理） | 中（需要配置类） |

### BeanDefinition 类型对比

| 类型 | 使用场景 | 特点 | 父定义支持 |
|------|---------|------|-----------|
| RootBeanDefinition | 容器内部使用 | 合并后的最终定义，信息完整 | 不支持 |
| ChildBeanDefinition | XML 继承 | 继承父定义，只记录差异 | 支持（必须） |
| GenericBeanDefinition | 通用场景 | 可以独立使用，也可以作为模板 | 支持（可选） |
| AnnotatedGenericBeanDefinition | @Configuration 类 | 包含注解元数据 | 支持 |
| ScannedGenericBeanDefinition | @Component 扫描 | 包含注解元数据和资源信息 | 支持 |

### BeanDefinitionReader 对比

| Reader | 配置源 | 核心方法 | 使用场景 |
|--------|--------|---------|---------|
| XmlBeanDefinitionReader | XML 文件 | loadBeanDefinitions(Resource) | 传统 XML 项目 |
| PropertiesBeanDefinitionReader | Properties 文件 | loadBeanDefinitions(Resource) | 简单配置 |
| AnnotatedBeanDefinitionReader | Java 类 | registerBean(Class) | 注解配置 |
| ClassPathBeanDefinitionScanner | 类路径 | scan(String... basePackages) | @Component 扫描 |

---

## 6 新手常见误区

### 误区 1："BeanDefinition 就是 Bean 实例"

**错！** BeanDefinition 是 Bean 的"元数据描述"，不是 Bean 本身：

```java
// 错误理解
BeanDefinition bd = ...;
// 以为 bd 就是 Bean 实例

// 正确理解
// BeanDefinition 是"菜谱"，记录了 Bean 的类名、作用域、依赖等信息
// Bean 实例是根据"菜谱"做出来的"菜"

// 类比：
// BeanDefinition = 建筑蓝图
// Bean 实例 = 建好的房子
```

### 误区 2："只能使用一种配置方式"

**错！** 三种配置方式可以混合使用：

```java
// ✅ 正确：混合使用多种配置
@Configuration
@ComponentScan("com.example")  // 注解扫描
@ImportResource("classpath:application.xml")  // 导入 XML
public class AppConfig {
    
    @Bean  // JavaConfig
    public DataSource dataSource() {
        return new HikariDataSource();
    }
}
```

### 误区 3："BeanDefinition 注册后就不能修改"

**错！** 在 BeanFactoryPostProcessor 中可以修改：

```java
// ❌ 错误：在普通 Bean 中修改
@Component
public class MyService {
    @Autowired
    private BeanFactory beanFactory;
    
    public void modify() {
        // 这时候已经太晚了，Bean 可能已经创建
        BeanDefinition bd = ((DefaultListableBeanFactory) beanFactory)
            .getBeanDefinition("otherService");
        bd.setScope("prototype");  // 可能无效！
    }
}

// ✅ 正确：在 BeanFactoryPostProcessor 中修改
@Component
public class MyBeanFactoryPostProcessor implements BeanFactoryPostProcessor {
    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
        // 这时候所有 BeanDefinition 已加载，但 Bean 还未创建
        BeanDefinition bd = beanFactory.getBeanDefinition("otherService");
        bd.setScope("prototype");  // 有效！
    }
}
```

### 误区 4："GenericBeanDefinition 和 RootBeanDefinition 是一样的"

**错！** 它们有重要区别：

```java
// GenericBeanDefinition - 通用定义
GenericBeanDefinition gbd = new GenericBeanDefinition();
gbd.setBeanClassName("com.example.UserService");
gbd.setParentName("baseService");  // 可以设置父定义

// RootBeanDefinition - 合并后的最终定义
// 在容器内部使用，是 BeanDefinition 的最终形态
RootBeanDefinition rbd = new RootBeanDefinition();
rbd.setBeanClass(UserService.class);  // 直接设置 Class 对象
// 不支持 setParentName，因为已经合并了
```

### 误区 5："XML 配置的 Bean 不能用注解注入"

**错！** 只要容器支持注解处理就行：

```xml
<!-- applicationContext.xml -->
<!-- 启用注解支持 -->
<context:annotation-config/>
<context:component-scan base-package="com.example"/>

<!-- XML 定义的 Bean 也可以使用 @Autowired -->
<bean id="userService" class="com.example.UserService"/>
```

```java
// UserService 可以用注解注入依赖
public class UserService {
    @Autowired  // 即使是 XML 定义的 Bean，也可以用注解注入
    private UserDao userDao;
}
```

---

## 7 动手练习

### 练习 1：基础练习 - 手动注册 BeanDefinition

使用 `BeanDefinitionBuilder` 手动注册以下 Bean：
1. `UserDao` - 单例，无依赖
2. `UserService` - 单例，依赖 `UserDao`，设置 `timeout` 属性为 3000
3. `UserController` - 原型，依赖 `UserService`

<details>
<summary>点击查看答案</summary>

```java
import org.springframework.beans.factory.support.BeanDefinitionBuilder;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.beans.factory.config.BeanDefinition;

public class Exercise1 {
    public static void main(String[] args) {
        // 1. 创建 BeanFactory
        DefaultListableBeanFactory beanFactory = new DefaultListableBeanFactory();
        
        // 2. 注册 UserDao（单例，无依赖）
        BeanDefinition userDaoDef = BeanDefinitionBuilder
            .genericBeanDefinition(UserDao.class)
            .setScope(BeanDefinition.SCOPE_SINGLETON)
            .getBeanDefinition();
        beanFactory.registerBeanDefinition("userDao", userDaoDef);
        
        // 3. 注册 UserService（单例，依赖 UserDao，timeout=3000）
        BeanDefinition userServiceDef = BeanDefinitionBuilder
            .genericBeanDefinition(UserService.class)
            .setScope(BeanDefinition.SCOPE_SINGLETON)
            .addPropertyReference("userDao", "userDao")  // 依赖注入
            .addPropertyValue("timeout", 3000)            // 设置属性
            .getBeanDefinition();
        beanFactory.registerBeanDefinition("userService", userServiceDef);
        
        // 4. 注册 UserController（原型，依赖 UserService）
        BeanDefinition userControllerDef = BeanDefinitionBuilder
            .genericBeanDefinition(UserController.class)
            .setScope(BeanDefinition.SCOPE_PROTOTYPE)  // 原型作用域
            .addPropertyReference("userService", "userService")  // 依赖注入
            .getBeanDefinition();
        beanFactory.registerBeanDefinition("userController", userControllerDef);
        
        // 5. 验证
        UserController controller1 = beanFactory.getBean("userController", UserController.class);
        UserController controller2 = beanFactory.getBean("userController", UserController.class);
        System.out.println("原型模式验证: " + (controller1 != controller2));
        
        UserService service1 = beanFactory.getBean("userService", UserService.class);
        UserService service2 = beanFactory.getBean("userService", UserService.class);
        System.out.println("单例模式验证: " + (service1 == service2));
    }
}

class UserDao {
    public void query() {
        System.out.println("UserDao 查询数据");
    }
}

class UserService {
    private UserDao userDao;
    private int timeout;
    
    public void setUserDao(UserDao userDao) { this.userDao = userDao; }
    public void setTimeout(int timeout) { this.timeout = timeout; }
    
    public void doSomething() {
        System.out.println("UserService 处理，timeout=" + timeout);
        userDao.query();
    }
}

class UserController {
    private UserService userService;
    
    public void setUserService(UserService userService) { this.userService = userService; }
    
    public void handle() {
        System.out.println("UserController 处理请求");
        userService.doSomething();
    }
}
```

</details>

### 练习 2：进阶练习 - 实现 BeanDefinition 继承

使用 XML 配置实现 BeanDefinition 的继承：
1. 定义一个 `baseService` 的抽象 Bean，包含公共属性
2. 定义 `userService` 继承 `baseService`，添加自己的属性
3. 验证子 Bean 是否正确继承了父 Bean 的属性

<details>
<summary>点击查看答案</summary>

```xml
<!-- application-context.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd">
    
    <!-- 父 Bean 定义（抽象，不可直接实例化） -->
    <bean id="baseService" class="com.example.BaseService" abstract="true">
        <property name="timeout" value="5000"/>
        <property name="retryCount" value="3"/>
        <property name="logger" value="default"/>
    </bean>
    
    <!-- 子 Bean 定义（继承 baseService） -->
    <bean id="userService" class="com.example.UserService" parent="baseService">
        <!-- 继承父 Bean 的属性，可以覆盖 -->
        <property name="timeout" value="3000"/>  <!-- 覆盖父 Bean 的值 -->
        <!-- 添加自己的属性 -->
        <property name="userDao" ref="userDao"/>
    </bean>
    
    <!-- 另一个子 Bean -->
    <bean id="orderService" class="com.example.OrderService" parent="baseService">
        <!-- 使用父 Bean 的 timeout=5000 和 retryCount=3 -->
        <property name="orderDao" ref="orderDao"/>
    </bean>
    
    <bean id="userDao" class="com.example.UserDao"/>
    <bean id="orderDao" class="com.example.OrderDao"/>
</beans>
```

```java
// 基类
public class BaseService {
    private int timeout;
    private int retryCount;
    private String logger;
    
    // getter 和 setter
    public int getTimeout() { return timeout; }
    public void setTimeout(int timeout) { this.timeout = timeout; }
    public int getRetryCount() { return retryCount; }
    public void setRetryCount(int retryCount) { this.retryCount = retryCount; }
    public String getLogger() { return logger; }
    public void setLogger(String logger) { this.logger = logger; }
    
    @Override
    public String toString() {
        return getClass().getSimpleName() + "{timeout=" + timeout + 
            ", retryCount=" + retryCount + ", logger=" + logger + "}";
    }
}

// UserService 继承 BaseService
public class UserService extends BaseService {
    private UserDao userDao;
    
    public void setUserDao(UserDao userDao) { this.userDao = userDao; }
    
    @Override
    public String toString() {
        return super.toString() + " + UserService{userDao=" + userDao + "}";
    }
}

// OrderService 继承 BaseService
public class OrderService extends BaseService {
    private OrderDao orderDao;
    
    public void setOrderDao(OrderDao orderDao) { this.orderDao = orderDao; }
}

// 测试
public class Exercise2 {
    public static void main(String[] args) {
        ClassPathXmlApplicationContext context = 
            new ClassPathXmlApplicationContext("application-context.xml");
        
        UserService userService = context.getBean("userService", UserService.class);
        System.out.println("UserService: " + userService);
        // 输出：UserService{timeout=3000, retryCount=3, logger=default} + UserService{userDao=...}
        // timeout 被覆盖为 3000，retryCount 和 logger 继承自父 Bean
        
        OrderService orderService = context.getBean("orderService", OrderService.class);
        System.out.println("OrderService: " + orderService);
        // 输出：OrderService{timeout=5000, retryCount=3, logger=default}
        // 所有属性都继承自父 Bean
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 自定义 BeanDefinition 解析器

实现一个简单的自定义配置解析器，从 Properties 文件中读取 BeanDefinition：

格式：`beanName=className,scope,lazyInit`

<details>
<summary>点击查看答案</summary>

```java
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.support.BeanDefinitionBuilder;
import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.beans.factory.support.BeanDefinitionStoreException;
import org.springframework.beans.factory.support.AbstractBeanDefinitionReader;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.EncodedResource;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

// 自定义 Properties BeanDefinition 解析器
public class CustomPropertiesBeanDefinitionReader extends AbstractBeanDefinitionReader {
    
    // 分隔符
    private static final String DELIMITER = ",";
    
    public CustomPropertiesBeanDefinitionReader(BeanDefinitionRegistry registry) {
        super(registry);
    }
    
    @Override
    public int loadBeanDefinitions(Resource resource) throws BeanDefinitionStoreException {
        return loadBeanDefinitions(new EncodedResource(resource));
    }
    
    public int loadBeanDefinitions(EncodedResource encodedResource) throws BeanDefinitionStoreException {
        try {
            // 1. 读取 Properties 文件
            Properties props = new Properties();
            InputStream is = encodedResource.getResource().getInputStream();
            props.load(is);
            
            int count = 0;
            
            // 2. 解析每个属性
            for (String key : props.stringPropertyNames()) {
                String value = props.getProperty(key);
                
                // 3. 解析 BeanDefinition
                BeanDefinition bd = parseBeanDefinition(key, value);
                
                // 4. 注册到容器
                getRegistry().registerBeanDefinition(key, bd);
                count++;
            }
            
            return count;
        } catch (IOException e) {
            throw new BeanDefinitionStoreException("Failed to load bean definitions", e);
        }
    }
    
    // 解析 BeanDefinition
    private BeanDefinition parseBeanDefinition(String beanName, String value) {
        // 格式：className,scope,lazyInit
        String[] parts = value.split(DELIMITER);
        
        if (parts.length < 1) {
            throw new IllegalArgumentException("Invalid bean definition: " + beanName + "=" + value);
        }
        
        String className = parts[0].trim();
        String scope = parts.length > 1 ? parts[1].trim() : BeanDefinition.SCOPE_SINGLETON;
        boolean lazyInit = parts.length > 2 && "true".equalsIgnoreCase(parts[2].trim());
        
        // 构建 BeanDefinition
        try {
            Class<?> beanClass = Class.forName(className);
            
            return BeanDefinitionBuilder
                .genericBeanDefinition(beanClass)
                .setScope(scope)
                .setLazyInit(lazyInit)
                .getBeanDefinition();
        } catch (ClassNotFoundException e) {
            throw new BeanDefinitionStoreException("Class not found: " + className, e);
        }
    }
}

// beans.properties 文件格式：
// userService=com.example.UserService,singleton,false
// userDao=com.example.UserDao,singleton,false
// orderService=com.example.OrderService,prototype,true

// 使用示例
public class Exercise3 {
    public static void main(String[] args) {
        // 1. 创建 BeanFactory
        DefaultListableBeanFactory beanFactory = new DefaultListableBeanFactory();
        
        // 2. 创建自定义 Reader
        CustomPropertiesBeanDefinitionReader reader = 
            new CustomPropertiesBeanDefinitionReader(beanFactory);
        
        // 3. 加载配置
        try {
            ClassPathResource resource = new ClassPathResource("beans.properties");
            int count = reader.loadBeanDefinitions(resource);
            System.out.println("注册了 " + count + " 个 BeanDefinition");
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // 4. 验证
        System.out.println("BeanDefinition 数量: " + beanFactory.getBeanDefinitionCount());
        for (String name : beanFactory.getBeanDefinitionNames()) {
            BeanDefinition bd = beanFactory.getBeanDefinition(name);
            System.out.println(name + " -> " + bd.getBeanClassName() + 
                ", scope=" + bd.getScope() + 
                ", lazyInit=" + bd.isLazyInit());
        }
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Bean 生命周期全解析**——也就是一个 Bean 从创建到销毁的完整过程。你会学到：

- Bean 的完整生命周期：实例化 → 属性填充 → 初始化 → 使用 → 销毁
- 生命周期中的各个扩展点和回调
- InitializingBean、DisposableBean 等回调接口的执行时机
- init-method 和 destroy-method 的底层实现

这些知识将帮助你理解 Spring 是如何管理 Bean 的"一生"的，以及如何在合适的时机插入自定义逻辑。
