function toggleProgressBar() {
    let progressBarHeader = document.getElementById("progressbar-header");
    let progressBarCells = document.querySelectorAll("td.progressbar");
    let toggle = document.querySelector("#progressbar-toggle mdui-checkbox");
    let display = toggle.checked ? "" : "none";
    progressBarHeader.style.display = display;
    progressBarCells.forEach(function (cell) { cell.style.display = display; });
}
function toggleSubInfo() {
    let toggle = document.querySelector("#subinfo-toggle mdui-checkbox");
    let display = toggle.checked ? "" : "none";

    let subInfoHeader = document.getElementById("subinfo-header");
    subInfoHeader.style.display = display;

    let subInfoCells = document.querySelectorAll("td.subinfo");
    subInfoCells.forEach(function (cell) { cell.style.display = display; });
}

function toggleSetidInfo() {
    let toggle = document.querySelector("#setid-toggle mdui-checkbox");
    let display = toggle.checked ? "" : "none";

    let setIdHeader = document.getElementById("setid-header");
    setIdHeader.style.display = display;

    let setIdCells = document.querySelectorAll("td.setid");
    setIdCells.forEach(function (cell) { cell.style.display = display; });
}
toggleProgressBar();
toggleSubInfo();
toggleSetidInfo();


// 线路选择框
function toggleCustomUrlInput() {
    // 获取id为"api-url-select"的元素
    const selectElement = document.getElementById("api-url-select");
    // 获取id为"custom-url-input"的元素
    const customUrlInput = document.getElementById("custom-url-input");

    // 如果selectElement的值为"custom"
    if (selectElement.value === "custom") {
        // 从customUrlInput的classList中移除"hidden"
        customUrlInput.classList.remove("hidden");
    } else {
        // 给customUrlInput的classList添加"hidden"
        customUrlInput.classList.add("hidden");
    }
}

let queriedApiKeys = [];
let serialNumber = 1;

/**
 * 格式化日期
 * @param {Date} date - 需要格式化的日期对象
 * @returns {string} - 格式化后的日期字符串（年-月-日）
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
}

async function checkBilling(apiKey, apiUrl) {
    const now = new Date();
    let startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
    const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const subDate = new Date(now);
    subDate.setDate(1);

    const headers = {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
    };
    const modelsCheck = `${apiUrl}/models`;
    const urlSubscription = `${apiUrl}/dashboard/billing/subscription`;
    let urlUsage = `${apiUrl}/dashboard/billing/usage?start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`;
    const urlsetid = apiUrl + '/organizations';
    const urlPaymentmethods = `${apiUrl}/dashboard/billing/payment_methods`;
    const urlRatelimits = `${apiUrl}/dashboard/rate_limits`;
    const urlAdvanceData = `${apiUrl}/dashboard/billing/credit_grants`; // 预付费查询接口

    try {
        let totalAmount, totalUsage, remaining, GPT35CheckResult, GPT4CheckResult, GPT432kCheckResult, setid, isSubscrible;
        let SubscribleInformation = {};
        let SubInformation;
        let errors = {};
        let response = await fetch(urlSubscription, { headers });
        let currentDate = new Date();
        const subscriptionData = await response.json();
        const expiryDate = new Date(subscriptionData.access_until * 1000 + 8 * 60 * 60 * 1000);
        const formattedDate = `${expiryDate.getFullYear()}-${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}-${expiryDate.getDate().toString().padStart(2, '0')}`;

        try {
            // 将订阅数据中的硬限制金额赋值给totalAmount变量
            totalAmount = subscriptionData.hard_limit_usd;

            // 通过fetch函数获取advanceData数据，传入urlAdvanceData和headers参数
            const advanceDataResponse = await fetch(urlAdvanceData, { headers });
            // 将响应解析为json格式
            const advanceData = await advanceDataResponse.json();

            // 如果订阅数据的计费机制为'advance'，或者总金额小于等于6并且订阅数据中没有信用卡信息
            if ((subscriptionData.billing_mechanism === 'advance') || (totalAmount <= 6 && !subscriptionData.has_credit_card)) {
                // 将advanceData中的total_granted属性值赋值给totalAmount变量
                totalAmount = advanceData.total_granted;
            }

        } catch (error) {
            // 捕获错误并打印到控制台
            console.error(error);
        }
        try {
            // 如果总金额大于6
            if (totalAmount > 6) {
                // 设置开始日期为子日期
                startDate = subDate;
                // 构建请求使用数据的URL
                urlUsage = `${apiUrl}/dashboard/billing/usage?start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`;
                // 发送请求获取使用数据的响应
                response = await fetch(urlUsage, { headers });
                // 将响应解析为JSON格式的数据
                const usageData = await response.json();
            }
            // 发送请求获取使用数据的响应
            response = await fetch(urlUsage, { headers });
            // 将响应解析为JSON格式的数据
            const usageData = await response.json();

            // 计算总使用量并除以100
            totalUsage = usageData.total_usage / 100;
            // 计算剩余金额并保留3位小数
            remaining = (totalAmount - totalUsage).toFixed(3);

        } catch (error) {
            // 输出错误信息
            console.error(error);

        }

        //获取是否绑卡
        try {
            if (subscriptionData.plan.id.includes('payg')) {
                switch (subscriptionData.billing_mechanism) {
                    case 'advance':
                        isSubscrible = '✅预付费';
                        break;
                    case 'arrears':
                        isSubscrible = '✅已欠费';
                        break;
                    case null:
                        isSubscrible = '✅后付费';
                        break;
                    default:
                        isSubscrible = '✅';
                }
            } else {
                isSubscrible = '❌';
            }
        } catch (error) {
            console.error(error);
        }
        //获取绑卡信息
        try {
            SubscribleInformation.account_name = subscriptionData.account_name;
            SubscribleInformation.po_number = subscriptionData.po_number;
            SubscribleInformation.billing_email = subscriptionData.billing_email;
            SubscribleInformation.tax_ids = subscriptionData.tax_ids;

            let billingAddress = subscriptionData.billing_address;
            let businessAddress = subscriptionData.business_address;

            SubInformation = "名称: " + SubscribleInformation.account_name + "\n";
            SubInformation += "PO号: " + SubscribleInformation.po_number + "\n";
            SubInformation += "帐单邮箱: " + SubscribleInformation.billing_email + "\n";
            SubInformation += "税号: " + SubscribleInformation.tax_ids + "\n";
            //使用 JavaScript 的可选链式调用来确定是否为null，避免异常控制台报错
            SubInformation += "账单地址: " + (billingAddress?.line1 ? billingAddress.line1 : '') + ", " + (billingAddress?.city ? billingAddress.city : '') + ", " + (billingAddress?.state ? billingAddress.state : '') + ", " + (billingAddress?.country ? billingAddress.country : '') + ", " + (billingAddress?.postal_code ? billingAddress.postal_code : '') + "\n";
            SubInformation += "商业地址: " + (businessAddress?.line1 ? businessAddress.line1 : '') + ", " + (businessAddress?.city ? businessAddress.city : '') + ", " + (businessAddress?.state ? businessAddress.state : '') + ", " + (businessAddress?.country ? businessAddress.country : '') + ", " + (businessAddress?.postal_code ? businessAddress.postal_code : '\n');

            response = await fetch(urlPaymentmethods, { headers });
            const paymentMethodsData = await response.json();

            if (paymentMethodsData.data && paymentMethodsData.data.length > 0) {
                paymentMethodsData.data.forEach((paymentMethod, index) => {
                    if (paymentMethod.type === 'card' && paymentMethod.card) {
                        const cardInfo = paymentMethod.card;
                        SubInformation += `\n\n付款方式 ${index + 1}: \n`;
                        SubInformation += paymentMethod.is_default ? "默认卡:\n" : "非默认卡:\n"; // Add default label
                        SubInformation += `卡种: ${cardInfo.brand} \n`; // Card Brand
                        SubInformation += `后4位: ${cardInfo.last4} \n`; // Card Last4
                        SubInformation += `卡日期: ${cardInfo.exp_month}/${cardInfo.exp_year} \n`; // Card Expiry
                        SubInformation += `卡国家: ${cardInfo.country}`; // Card Country
                    }
                });
            }

        }
        catch (error) {
            console.error(error);
        }
        //组织信息
        try {
            response = await fetch(urlsetid, { headers });
            const setiddata = await response.json();
            setid = '';
            const emailStartIndex = setiddata.data[0].description.lastIndexOf(' ') + 1;
            const email = setiddata.data[0].description.substring(emailStartIndex);
            const title = setiddata.data[0].title;
            const id1 = setiddata.data[0].id;
            const name = setiddata.data[0].name;
            const description = setiddata.data[0].description;
            const createdTimestamp = setiddata.data[0].created;
            const createdDate = new Date(createdTimestamp * 1000);
            // 格式化日期
            const formattedDate = `${createdDate.getFullYear()}.${(createdDate.getMonth() + 1).toString().padStart(2, '0')}.${createdDate.getDate().toString().padStart(2, '0')}`;
            const timeAndZone = createdDate.toString().match(/\d{2}:\d{2}:\d{2} \w+/)[0];
            if (typeof setiddata.data[1] !== 'undefined') {
                const id2 = setiddata.data[1].id;
                setid = `${title}\n${email}\n${id1}\n${id2}\n${name}\n${description}\n${formattedDate} ${timeAndZone}`;
            } else {
                setid = `${title}\n${email}\n${id1}\n${name}\n${description}\n${formattedDate} ${timeAndZone}`;
            }
            if (typeof setiddata.data[1] !== 'undefined') {
                const id2 = setiddata.data[1].id;
                setid = `人名: ${title}\n邮箱: ${email}\n组织: ${id1} ${id2}\nUserID:${name}\n\n注册时间:${formattedDate} ${timeAndZone}`;
            } else {
                setid = `人名: ${title}\n邮箱: ${email}\n组织: ${id1} \nUserID:${name}\n注册时间:${formattedDate} ${timeAndZone}`;
            }

        } catch (error) {
            console.error(error);
            errors['setid'] = error.message;
        }
        //获取速率
        let rateLimits;
        try {
            const response = await fetch(urlRatelimits, { headers });
            const rateLimitsData = await response.json();
            rateLimits = {
                'gpt-3.5-turbo': rateLimitsData['gpt-3.5-turbo'],
                'gpt-3.5-turbo-16k': rateLimitsData['gpt-3.5-turbo-16k'],
                'gpt-4': rateLimitsData['gpt-4'],
                'gpt-4-32k': rateLimitsData['gpt-4-32k']
            };
        } catch (error) {
            console.error(error);
            errors['rateLimits'] = error.message;
        }
        // 初始化模型查询结果
        GPT35CheckResult = '❌';
        GPT4CheckResult = '❌';
        GPT432kCheckResult = '❌';
        //3.5模型查询
        let GPT35CheckSuccess = false; // 初始化为 false
        try {
            const modelsCheckResponse = await fetch(modelsCheck, { headers });
            const modelsCheckData = await modelsCheckResponse.json();

            GPT35CheckSuccess = GPT35CheckResult = Array.isArray(modelsCheckData.data) && modelsCheckData.data.some(item => item.id.includes('gpt-3.5-turbo')) ? '✅' : '❌';
            GPT4CheckResult = Array.isArray(modelsCheckData.data) && modelsCheckData.data.some(item => item.id.includes('gpt-4')) ? '✅' : '❌';
            GPT432kCheckResult = Array.isArray(modelsCheckData.data) && modelsCheckData.data.some(item => item.id.includes('gpt-4-32k')) ? '✅' : '❌';
        } catch (error) {
            console.error(error);
        }

        // 发起请求查有效
        async function checkCompletion(apiKey, apiUrl) {
            // 设置请求的url
            const urlCompletion = `${apiUrl}/chat/completions`;
            // 设置请求头
            const headers = {
                "Authorization": "Bearer " + apiKey,
                "Content-Type": "application/json"
            };
            // 设置请求体
            const postBody = JSON.stringify({
                "model": "gpt-3.5-turbo",
                "messages": [{
                    "role": "user",
                    "content": "hi"
                }],
                "max_tokens": 1
            });

            // 发起请求
            let response = await fetch(urlCompletion, {
                method: 'POST',
                headers: headers,
                body: postBody
            });

            // 获取响应数据
            let data = await response.json();
            // 判断请求是否成功
            if (response.status === 200) {
                return ['✅', data.usage.total_tokens]; // 返回状态和 total_tokens
            } else {
                return ['❌', null];
            }
        }
        // 调用 checkCompletion 函数并获取结果
        let completionCheckResult = await checkCompletion(apiKey, apiUrl);
        //返回值
        return [totalAmount, totalUsage, remaining, formattedDate, GPT35CheckResult, GPT4CheckResult, GPT432kCheckResult, isSubscrible, SubInformation, setid, errors, GPT35CheckSuccess, completionCheckResult, rateLimits];
    } catch (error) {
        return ["Error", null, null, null, null, null, null, null, null, null];
    }
}



//查询函数
function sendRequest() {
    toggleProgressBar();
    toggleSubInfo();
    toggleSetidInfo();

    let apiKeyInput = document.getElementById("api-key-input");
    let apiUrlSelect = document.getElementById("api-url-select");
    let customUrlInput = document.getElementById("custom-url-input");
    let table = document.getElementById("result-table");
    table.style.visibility = "visible";

    if (apiKeyInput.value.trim() === "") {
        mdui.alert({
            headline: "未匹配到 API-KEY",
            description: "请检查输入内容",
            confirmText: "OK",
        })
        return;
    }

    document.getElementById("result-table").getElementsByTagName('tbody')[0].innerHTML = "";

    let apiUrl = "";
    // 判断用户选择的API URL选项
    if (apiUrlSelect.value === "custom") {
        if (customUrlInput.value.trim() === "") {
            mdui.alert({
                headline: "无查询线路",
                description: "请选择或自定义",
                confirmText: "OK",
            })
            return;
        } else {
            apiUrl = customUrlInput.value.trim();

            if (!apiUrl.startsWith("http://") && !apiUrl.startsWith("https://")) {
                apiUrl = "https://" + apiUrl;
            }

            if (!apiUrl.startsWith("https://gateway.ai.cloudflare.com")) {
                apiUrl += "/v1"; // 如果不是，则添加路径‘/v1’
            }
        }
    } else {
        apiUrl = apiUrlSelect.value;

        if (apiUrlSelect.value === "https://gateway.ai.cloudflare.com/v1/feedd0aa8abd6875052d86a94f1baf83/test/openai") {
            apiUrl = apiUrl.replace("/v1", ""); // 如果用户选择的选项是https://gateway.ai.cloudflare.com开头，则删除/v1
        } else {
            apiUrl += "/v1"; // 如果不是，则添加路径‘/v1’
        }
    }



    let apiKeys = parseKeys(apiKeyInput.value);

    mdui.alert({
        headline: "成功匹配到 API Key",
        description: apiKeys,
        confirmText: "OK",
    });



    showLoadingAnimation();

    function parseKeys(input) {
        let lines = input.split(/\n/);
        let result = [];
        for (let line of lines) {
            let sessKeyMatch = line.match(/sess-[^-]+/);
            let skKeyMatch = line.match(/sk-[^-]+/);

            if (sessKeyMatch !== null && skKeyMatch !== null) {
                result.push(sessKeyMatch[0]);
            }
            else if (skKeyMatch !== null) {
                result.push(skKeyMatch[0]);
            }
            else if (sessKeyMatch !== null) {
                result.push(sessKeyMatch[0]);
            }else {
                // 如果没有匹配到任何内容，保留原始行
                result.push(line);
            }
        }
        return result;
    }


    let lastQueryPromise = null;

    let tableBody = document.querySelector("#result-table tbody");
    for (let i = 0; i < apiKeys.length; i++) {
        let apiKey = apiKeys[i].trim();

        if (queriedApiKeys.includes(apiKey)) {
            mdui.alert({
                headline: "重复提示",
                description: `API KEY ${apiKey} 已查询过，跳过此次查询`,
                confirmText: "OK"
            })
            continue;
        }
        queriedApiKeys.push(apiKey);

        checkBilling(apiKey, apiUrl).then((data) => {
            data = data.map(item => {
                if (item === undefined) {
                    return 'Not Found.'
                } else {
                    return item
                }
            }
            )
            let row = document.createElement("tr");

            let serialNumberCell = document.createElement("td"); // 创建序列号单元格
            serialNumberCell.textContent = serialNumber;
            row.appendChild(serialNumberCell);

            let apiKeyCell = document.createElement("td");
            apiKeyCell.textContent = apiKey.replace(/^(.{5}).*(.{4})$/, "$1***$2");
            row.appendChild(apiKeyCell);

            console.log('查看查询结果', data); // 添加 console.log 以查看 data 的值

            let totalAmount = document.createElement("td");
            totalAmount.textContent = typeof data[0] === "number" ? data[0] : "无值";
            row.appendChild(totalAmount);

            let totalUsedCell = document.createElement("td");
            typeof data[1] === "number" ? data[1].toFixed(3) : '无值';
            if (isNaN(data[1])) {
                totalUsedCell.textContent = "无值";
            } else {
                totalUsedCell.textContent = data[1].toFixed(3);
            }
            row.appendChild(totalUsedCell);

            let totalAvailableCell = document.createElement("td");
            if (isNaN(data[2])) {
                totalAvailableCell.textContent = "无值";
            } else {
                totalAvailableCell.textContent = data[2];
            }
            row.appendChild(totalAvailableCell);

            // 进度条
            let progressCell = document.createElement("td");
            progressCell.classList.add("progressbar");
            let progressContainer = document.createElement("div"); // 添加一个新的容器元素
            progressContainer.style.width = "100%";
            progressContainer.style.height = "20px";
            progressContainer.style.backgroundColor = "#f3f3f3"; // 设置容器的背景色为灰白色
            let progressBar = document.createElement("div");
            progressBar.style.width = (data[1] / data[0] * 100).toFixed(2) + "%";
            progressBar.style.height = "20px";
            progressBar.style.backgroundColor = "#4CAF50";
            progressBar.style.position = "relative"; // 设置进度条的 position 为 relative
            progressBar.textContent = (data[1] / data[0] * 100).toFixed(2) + "%"; // 显示百分比
            progressBar.style.textAlign = "right"; // 设置文本对齐方式为右对齐
            progressBar.style.paddingRight = "5px"; // 设置右边距以确保文本不超出边界
            progressBar.style.color = "black"; // 设置文本颜色为白色
            progressContainer.appendChild(progressBar); // 将进度条添加到容器中
            progressCell.appendChild(progressContainer); // 将容器添加到单元格中
            row.appendChild(progressCell);
            progressCell.style.display = document.querySelector("#progressbar-toggle mdui-checkbox").checked ? "" : "none";


            // 到期时间
            let expireTime = document.createElement("td");
            if (data[3] === "1970-01-01") {
                expireTime.textContent = "永久有效";
            } else if (data[3] === "NaN-NaN-NaN") {
                expireTime.textContent = "无值";
            } else {
                expireTime.textContent = data[3];
            }
            row.appendChild(expireTime);


            let GPT35CheckResult = document.createElement("td");
            GPT35CheckResult.textContent = data[4];
            let GPT4CheckResult = document.createElement("td");
            GPT4CheckResult.textContent = data[5];
            let GPT432kCheckResult = document.createElement("td");
            GPT432kCheckResult.textContent = data[6];
            let highestModel = document.createElement("td");
            if (GPT35CheckResult.textContent === "✅" && GPT4CheckResult.textContent === "❌" && GPT432kCheckResult.textContent === "❌") {
                highestModel.textContent = "gpt3.5";
            } else if (GPT35CheckResult.textContent === "✅" && GPT4CheckResult.textContent === "✅" && GPT432kCheckResult.textContent === "❌") {
                highestModel.textContent = "gpt4";
            } else if (GPT35CheckResult.textContent === "✅" && GPT4CheckResult.textContent === "✅" && GPT432kCheckResult.textContent === "✅") {
                highestModel.textContent = "gpt4-32K";
            } else {
                highestModel.textContent = "❌";
            }

            row.appendChild(highestModel);

            let isSubscribe = document.createElement("td");
            isSubscribe.style.whiteSpace = "pre"; // 添加这一行来保留换行
            isSubscribe.textContent = data[7];
            if (data[7] === "Not Found.") {
                isSubscribe.textContent = "无值";
            } else {
                isSubscribe.textContent = data[7];
            }

            row.appendChild(isSubscribe);

            let SubInformation = document.createElement("td");
            SubInformation.classList.add("subinfo");
            let SubInformationContainer = document.createElement("div");
            SubInformationContainer.style.whiteSpace = "pre-wrap";
            SubInformationContainer.textContent = data[8];

            SubInformation.appendChild(SubInformationContainer);
            row.appendChild(SubInformation);
            SubInformation.style.display = document.querySelector("#subinfo-toggle mdui-checkbox").checked ? "" : "none";


            let setidCell = document.createElement("td");
            setidCell.classList.add("setid");
            let setidCellContainer = document.createElement("div");
            setidCellContainer.style.whiteSpace = "pre-wrap";
            setidCellContainer.textContent = data[9];
            setidCell.appendChild(setidCellContainer);
            row.appendChild(setidCell);
            setidCell.style.display = document.querySelector("#setid-toggle mdui-checkbox").checked ? "" : "none";


            let rateLimitsDataCell = document.createElement("td");
            let rateLimitsDataContainer = document.createElement("div");
            rateLimitsDataContainer.style.whiteSpace = "pre-wrap";
            if (data[13]) {
                let rateLimitsData = data[13];
                let models = ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-32k'];
                let rateLimitsText = '';
                for (let model of models) {
                    if (rateLimitsData[model]) {
                        let modelName = '';
                        if (model === 'gpt-3.5-turbo') {
                            modelName = 'gpt3.5';
                        } else if (model === 'gpt-3.5-turbo-16k') {
                            modelName = 'gpt3.5-16K';
                        } else if (model === 'gpt-4') {
                            modelName = 'gpt4';
                        } else if (model === 'gpt-4-32k') {
                            modelName = 'gpt4-32K';
                        }
                        rateLimitsText += `${modelName}: ${rateLimitsData[model].max_requests_per_1_minute}, ${rateLimitsData[model].max_tokens_per_1_minute}-${rateLimitsData[model].max_requests_per_1_day}\n`;
                    } else {
                        rateLimitsText += model + ": ❌\n";
                    }
                }
                rateLimitsDataContainer.textContent = rateLimitsText;
            }

            rateLimitsDataCell.appendChild(rateLimitsDataContainer);
            row.appendChild(rateLimitsDataCell);


            // 是否有效列
            let completionCheckResultCell = document.createElement("td");
            completionCheckResultCell.innerHTML = `<span style="font-size:24px">${data[12][0]}</span><br>消耗${data[12][1]} tokens`; // 使用 innerHTML 添加两行内容
            row.appendChild(completionCheckResultCell);



            tableBody.appendChild(row);

            if (i === apiKeys.length - 1) {
                queriedApiKeys = [];
            }
            serialNumber++; // 增加序列号
            table.style.display = 'table';

        })
        lastQueryPromise = checkBilling(apiKey, apiUrl).then((data) => {
            // 查询完成后的代码...

            hideLoadingAnimation();
        });
    }
    if (lastQueryPromise) {
        lastQueryPromise.then(() => {
            hideLoadingAnimation();
        });
    }

}


function showLoadingAnimation() {
    const button = document.getElementById("query-button");

    // 创建一个新的 <mdui-linear-progress> 元素
    const progressElement = document.createElement("mdui-linear-progress");
    progressElement.id = "query-progress";

    // 将新元素替代原始按钮元素
    button.parentElement.replaceChild(progressElement, button);
}

function hideLoadingAnimation() {
    const progressElement = document.querySelector("mdui-linear-progress");

    if (progressElement) {
        const button = document.createElement("mdui-button");
        button.id = "query-button";
        button.innerHTML = "查询";
        button.setAttribute("full-width", "");
        button.setAttribute("icon", "search");
        button.setAttribute("onclick", "sendRequest()");

        // 将原始按钮元素替代回来
        progressElement.parentElement.replaceChild(button, progressElement);
    }
}



const navigationDrawer = document.querySelector(".left-drawer");
const toggleButton = document.getElementById("toggle-button");

let isOpen = true;

toggleButton.addEventListener("click", () => {
    isOpen = !isOpen;
    if (isOpen) {
        navigationDrawer.open = true;
    } else {
        navigationDrawer.open = false;
    }
});