# openai-billing-query
批量可视化查询openai(chatgpt)余额，支持显示总量，已使用，剩余量，已用比例，到期时间，GPT-4，是否绑卡

## [English](README_EN.md)

# 7月22日更新后，需登录一次账号，F12查看sess码，使用sess码进行查询

7月22日更新后，已删除key校验规则，需使用sess码进行查询。使用key只能查询总额度、绑卡、GPT4和组织ID。

![1689957580942.png](https://cdn-img.czl.net/2023/07/22/64bab4daba587.png)

# 查询示例图
![1688789680187.png](https://cdn-img.czl.net/2023/07/08/64a8e2b180068.png)

# 支持自定义反代接口
在第361行添加自己的接口代码

``` html
<option value="反代网址">【自定义名称】自定义名称</option>
```
## 反代代码示例
![image](https://github.com/woodchen-ink/openai-billing-query/assets/95951386/0bcdb51b-de08-49bc-bd01-5bf731f53d02)

# 怎么部署
什么？这还用问？下载index.html直接打开就行，除了背景图片，没有任何外部资源。

# 开发过程
首先感谢Github上开源的几个查询代码，是基于他们的项目使用GPT4进行改的，全程我只手动改了几个css。

# 广告
- [CZL Chat](https://chat.czl.net)，稳定商业版AI服务。
- [CZLOapi](https://oapi.czl.net)，OPENAI代理服务，无需翻墙。

# 广告
个人博客：https://woodchen.ink

