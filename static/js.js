function toggleProgressBar() {
    let progressBarHeader = document.getElementById("progressbar-header");
    let progressBarCells = document.querySelectorAll("td.progressbar");
    let toggle = document.querySelector("#progressbar-toggle input");
    let display = toggle.checked ? "" : "none";
    progressBarHeader.style.display = display;
    progressBarCells.forEach(function (cell) { cell.style.display = display; });
}
function toggleSubInfo() {
    let toggle = document.querySelector("#subinfo-toggle input");
    let display = toggle.checked ? "" : "none";

    let subInfoHeader = document.getElementById("subinfo-header");
    subInfoHeader.style.display = display;

    let subInfoCells = document.querySelectorAll("td.subinfo");
    subInfoCells.forEach(function (cell) { cell.style.display = display; });
}

function toggleSetidInfo() {
    let toggle = document.querySelector("#setid-toggle input");
    let display = toggle.checked ? "" : "none";

    let setIdHeader = document.getElementById("setid-header");
    setIdHeader.style.display = display;

    let setIdCells = document.querySelectorAll("td.setid");
    setIdCells.forEach(function (cell) { cell.style.display = display; });
}
toggleProgressBar();
toggleSubInfo();
toggleSetidInfo();

let queriedApiKeys = [];
let serialNumber = 1;

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
    const modelsCheck = `${apiUrl}/v1/models`;
    const urlSubscription = `${apiUrl}/v1/dashboard/billing/subscription`;
    let urlUsage = `${apiUrl}/v1/dashboard/billing/usage?start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`;
    const urlsetid = apiUrl + '/v1/organizations';
    const urlPaymentmethods = `${apiUrl}/v1/dashboard/billing/payment_methods`;
    const urlRatelimits = `${apiUrl}/v1/dashboard/rate_limits`;
    const urlAdvanceData = apiUrl + '/dashboard/billing/credit_grants'; // 预付费查询接口

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
            totalAmount = subscriptionData.hard_limit_usd;

            const advanceDataResponse = await fetch(urlAdvanceData, { headers });
            const advanceData = await advanceDataResponse.json();

            if ((subscriptionData.billing_mechanism === 'advance') || (totalAmount <= 6 && !subscriptionData.has_credit_card)) {
                totalAmount = advanceData.total_granted;
            }

        } catch (error) {
            console.error(error);
        }
        try {
            if (totalAmount > 6) {
                startDate = subDate;
            }
            response = await fetch(urlUsage, { headers });
            const usageData = await response.json();

            totalUsage = usageData.total_usage / 100;
            remaining = (totalAmount - totalUsage).toFixed(3);

        } catch (error) {
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
            const urlCompletion = `${apiUrl}/v1/chat/completions`;
            const headers = {
                "Authorization": "Bearer " + apiKey,
                "Content-Type": "application/json"
            };
            const postBody = JSON.stringify({
                "model": "gpt-3.5-turbo",
                "messages": [{
                    "role": "user",
                    "content": "Hello"
                }],
                "max_tokens": 5
            });

            let response = await fetch(urlCompletion, {
                method: 'POST',
                headers: headers,
                body: postBody
            });

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
    showLoadingAnimation();
    toggleProgressBar();
    toggleSubInfo();
    toggleSetidInfo();

    let apiKeyInput = document.getElementById("api-key-input");
    let apiUrlSelect = document.getElementById("api-url-select");
    let customUrlInput = document.getElementById("custom-url-input");
    let table = document.getElementById("result-table");
    table.style.visibility = "visible";

    if (apiKeyInput.value.trim() === "") {
        alert("请填写API KEY");
        return;
    }

    document.getElementById("result-table").getElementsByTagName('tbody')[0].innerHTML = "";

    let apiUrl = "";
    if (apiUrlSelect.value === "custom") {
        if (customUrlInput.value.trim() === "") {
            alert("请设置API链接");
            return;
        } else {
            apiUrl = customUrlInput.value.trim();
            if (!apiUrl.startsWith("http://") && !apiUrl.startsWith("https://")) {
                apiUrl = "https://" + apiUrl;
            }
        }
    } else {
        apiUrl = apiUrlSelect.value;
    }


    let apiKeys = parseKeys(apiKeyInput.value);

    if (apiKeys.length === 0) {
        alert("未匹配到 API-KEY，请检查输入内容");
        return;
    }
    alert("成功匹配到 API Key，确认后开始查询：" + apiKeys);

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
            }
        }
        return result;
    }


    let lastQueryPromise = null;

    let tableBody = document.querySelector("#result-table tbody");
    for (let i = 0; i < apiKeys.length; i++) {
        let apiKey = apiKeys[i].trim();

        if (queriedApiKeys.includes(apiKey)) {
            console.log(`API KEY ${apiKey} 已查询过，跳过此次查询`);
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
            row.classList.add("bg-gray-600");
            row.classList.add("bg-opacity-60");
            row.classList.add("border");
            row.classList.add("border-slate-500");

            let serialNumberCell = document.createElement("td"); // 创建序列号单元格
            serialNumberCell.classList.add("border");
            serialNumberCell.classList.add("border-slate-500");
            serialNumberCell.textContent = serialNumber;
            row.appendChild(serialNumberCell);

            let apiKeyCell = document.createElement("td");
            apiKeyCell.classList.add("border");
            apiKeyCell.classList.add("border-slate-500");
            apiKeyCell.textContent = apiKey.replace(/^(.{5}).*(.{4})$/, "$1***$2");
            row.appendChild(apiKeyCell);

            console.log('查看查询结果', data); // 添加 console.log 以查看 data 的值

            let totalAmount = document.createElement("td");
            totalAmount.classList.add("border");
            totalAmount.classList.add("border-slate-500");
            totalAmount.textContent = typeof data[0] === "number" ? data[0] : "无值";
            row.appendChild(totalAmount);

            let totalUsedCell = document.createElement("td");
            totalUsedCell.classList.add("border");
            totalUsedCell.classList.add("border-slate-500");
            typeof data[1] === "number" ? data[1].toFixed(3) : '无值';
            if(isNaN(data[1])){
                totalUsedCell.textContent = "无值";
            }else{
                totalUsedCell.textContent = data[1].toFixed(3);
            }
            row.appendChild(totalUsedCell);

            let totalAvailableCell = document.createElement("td");
            totalAvailableCell.classList.add("border");
            totalAvailableCell.classList.add("border-slate-500");
            if(isNaN(data[2])){
                totalAvailableCell.textContent = "无值";
            }else{
                totalAvailableCell.textContent = data[2];
            }
            row.appendChild(totalAvailableCell);

            // 进度条
            let progressCell = document.createElement("td");
            progressCell.classList.add("progressbar");
            progressCell.classList.add("border");
            progressCell.classList.add("border-slate-500");
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
            progressCell.style.display = document.querySelector("#progressbar-toggle input").checked ? "" : "none";


            // 到期时间
            let expireTime = document.createElement("td");
            expireTime.classList.add("border");
            expireTime.classList.add("border-slate-500");
            if (data[3] === "1970-01-01") {
                expireTime.textContent = "永久有效";
            }else if(data[3] === "NaN-NaN-NaN"){
                expireTime.textContent = "无值";
            }else{
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
            highestModel.classList.add("border");
            highestModel.classList.add("border-slate-500");
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
            isSubscribe.classList.add("border");
            isSubscribe.classList.add("border-slate-500");
            isSubscribe.style.whiteSpace = "pre"; // 添加这一行来保留换行
            isSubscribe.textContent = data[7];
            if (data[7] === "Not Found.") { 
                isSubscribe.textContent = "无值";
            } else {
                isSubscribe.textContent = data[7];
            }
           
            row.appendChild(isSubscribe);

            let SubInformation = document.createElement("td");
            SubInformation.classList.add("border-slate-500");
            SubInformation.classList.add("border");
            SubInformation.classList.add("subinfo");
            let SubInformationContainer = document.createElement("div");
            SubInformationContainer.style.whiteSpace = "pre-wrap";
            SubInformationContainer.textContent = data[8];

            SubInformation.appendChild(SubInformationContainer);
            row.appendChild(SubInformation);
            SubInformation.style.display = document.querySelector("#subinfo-toggle input").checked ? "" : "none";


            let setidCell = document.createElement("td");
            setidCell.classList.add("border");
            setidCell.classList.add("border-slate-500");
            setidCell.classList.add("setid");
            let setidCellContainer = document.createElement("div");
            setidCellContainer.style.whiteSpace = "pre-wrap";
            setidCellContainer.textContent = data[9];
            setidCell.appendChild(setidCellContainer);
            row.appendChild(setidCell);
            setidCell.style.display = document.querySelector("#setid-toggle input").checked ? "" : "none";


            let rateLimitsDataCell = document.createElement("td");
            rateLimitsDataCell.classList.add("border");
            rateLimitsDataCell.classList.add("border-slate-500");
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
                        rateLimitsText += `${modelName}: ${rateLimitsData[model].max_requests_per_1_minute}, ${rateLimitsData[model].max_tokens_per_1_minute}\n`;
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
            completionCheckResultCell.classList.add("border");
            completionCheckResultCell.classList.add("border-slate-500");
            completionCheckResultCell.innerHTML = `<span style="font-size:24px">${data[12][0]}</span><br>消耗${data[12][1]} tokens`; // 使用 innerHTML 添加两行内容
            row.appendChild(completionCheckResultCell);



            tableBody.appendChild(row);

            if (i === apiKeys.length - 1) {
                queriedApiKeys = [];
            }
            serialNumber++; // 增加序列号
            table.style.display = 'table';

            hideLoadingAnimation();

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


function toggleCustomUrlInput() {
    const selectElement = document.getElementById("api-url-select");
    const customUrlInput = document.getElementById("custom-url-input");

    if (selectElement.value === "custom") {
        customUrlInput.classList.remove("hidden");
    } else {
        customUrlInput.classList.add("hidden");
    }
}

function showLoadingAnimation() {
    const button = document.getElementById("query-button");
    button.disabled = true;
    button.innerHTML = `
    <span class="loading loading-ring "></span>
    `;
}

function hideLoadingAnimation() {
    const button = document.getElementById("query-button");
    button.disabled = false;
    button.innerHTML = "查询";
}

