# openai-billing-query
Batch visualization query for openai (chatgpt) balance, supporting display of total amount, used amount, remaining amount, usage ratio, expiration time, GPT-4, and whether it is bound with a card.

# After the update on July 22nd, you need to log in to your account once. Use F12 to view the session code and use the session code for queries.

After the update on July 22nd, the key verification rule has been removed. You need to use the session code for queries. The key can only be used to query the total amount, binding of cards, GPT4, and organization ID.

![1689957580942.png](https://cdn-img.czl.net/2023/07/22/64bab4daba587.png)

# Query example image
![1688789680187.png](https://cdn-img.czl.net/2023/07/08/64a8e2b180068.png)

# Supports custom reverse proxy interfaces
Add your own interface code in line 361.

``` html
<option value="Reverse proxy URL">[Custom name] Custom name</option>
```
## Reverse proxy code example
![image](https://github.com/woodchen-ink/openai-billing-query/assets/95951386/0bcdb51b-de08-49bc-bd01-5bf731f53d02)

# How to deploy
What? Do you still need to ask? Download index.html and open it directly. Except for the background image, there are no external resources.

# Development process
First of all, thanks to several open source query codes on Github. This project was based on their projects and modified to use GPT4. I only manually modified a few css throughout the process.

# Advertisement
Personal blog: https://woodchen.ink
