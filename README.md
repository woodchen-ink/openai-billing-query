# openai-billing-query
批量可视化查询openai(chatgpt)余额，支持显示总量，已使用，剩余量，已用比例，到期时间，GPT-4，是否绑卡

## [English](README_EN.md)

## 7月29日更新（点个star吧）

1. 新增GPT-3.5查询、绑卡信息（人名和地址）、组织名称、邮箱、组织ID、是否有效；
2. 使用sk查询不再整体报错，而是展示可以查询到的内容；

[qiyue](https://github.com/qiyue-rgb)提供了协助。

### sess查询示例（120刀4.0key）

![1690562370550.png](https://cdn-img.czl.net/2023/07/29/64c3ef5003257.png)

### sk查询示例(120刀4.0key)

![1690562289330.png](https://cdn-img.czl.net/2023/07/29/64c3eefec26cd.png)

### sk查询示例（5刀未绑卡key）

![1690562178945.png](https://cdn-img.czl.net/2023/07/29/64c3ee9070310.png)

## 7月22日更新后，如要查看完整信息，需登录一次账号，F12查看sess码，使用sess码进行查询

7月22日更新后，已删除key校验规则，需使用sess码进行查询。使用key只能查询部分信息。

![1689957580942.png](https://cdn-img.czl.net/2023/07/22/64bab4daba587.png)

## SESS ID获取方法

请见我的个人博客，提供视频教程：https://woodchen.ink/1266.html

## 支持自定义反代接口
在第361行添加自己的接口代码

``` html
<option value="反代网址">【自定义名称】自定义名称</option>
```
## 反代代码示例
![image](https://github.com/woodchen-ink/openai-billing-query/assets/95951386/0bcdb51b-de08-49bc-bd01-5bf731f53d02)

## 怎么部署
下载index.html直接打开就行，除了背景图片，没有任何外部资源。


## 广告
- [CZL Chat](https://chat.czl.net)，稳定商业版AI服务。
- [CZLOapi](https://oapi.czl.net)，OPENAI代理服务，无需翻墙。
- 个人博客：https://woodchen.ink

