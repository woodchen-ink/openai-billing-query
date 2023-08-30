let queriedApiKeys = [];
let serialNumber = 1;


async function checkBilling(apiKey, apiUrl) {
    const headers = {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
    };
    const urlGetsess = `${apiUrl}/dashboard/onboarding/login`;

    try {
        let getSess;
        try {
            const response = await fetch(urlGetsess, {
                method: "POST", // 设置请求方法为 POST
                headers: headers,
                body: JSON.stringify({}) // 此处放置要发送的数据
            });

            const getsessdata = await response.json();
            console.log(getsessdata);
            
            // 获取"sensitive_id"
            const sensitiveId = getsessdata.user.session.sensitive_id;

            // 现在，sensitiveId 包含了"sensitive_id"的值
            console.log(sensitiveId);
            return [sensitiveId];
        } catch (error) {
            console.error(error);
        }

    } catch (error) {
        console.error(error);
        return [null];
    }
}

//查询函数
async function sendRequest() {
    let button = document.querySelector("button");
    button.textContent = "加载中...";
    button.disabled = true;
    button.classList.add("loading")

    let apiKeyInput = document.getElementById("api-key-input");
    let apiUrlSelect = document.getElementById("api-url-select");
    let customUrlInput = document.getElementById("custom-url-input");
    let table = document.getElementById("result-table");
    let h2 = document.getElementById("result-head");
    h2.style.visibility = "visible";
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

    let apiKeys = apiKeyInput.value.split(/[,\s，\n]+/);

    if (apiKeys.length === 0) {
        alert("未匹配到 API-KEY，请检查输入内容");
        return;
    }

    alert("成功匹配到 API Key，确认后开始查询：" + apiKeys);

    let tableBody = document.querySelector("#result-table tbody");
    for (let i = 0; i < apiKeys.length; i++) {
        let apiKey = apiKeys[i].trim();

        if (queriedApiKeys.includes(apiKey)) {
            console.log(`API KEY ${apiKey} 已查询过，跳过此次查询`);
            continue;
        }
        queriedApiKeys.push(apiKey);

        // 使用 await 关键字等待 checkBilling 的结果
        let data = await checkBilling(apiKey, apiUrl);

        data = data.map(item => {
            if (item === undefined || item === null) {
                return 'Not Found.'
            } else {
                return item;
            }
        })
        

        let row = document.createElement("tr");

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
            serialNumberCell.textContent = serialNumber; // 设置序列号文本
            row.appendChild(serialNumberCell); // 将序列号单元格添加到行中

            let apiKeyCell = document.createElement("td");
            apiKeyCell.textContent = apiKey.replace(/^(.{10}).*(.{8})$/, "$1***$2");
            row.appendChild(apiKeyCell);

            console.log('查看查询结果', data); // 添加 console.log 以查看 data 的值

            if (data[0] === undefined) {
                let errorMessageCell = document.createElement("td");
                errorMessageCell.colSpan = "8";
                errorMessageCell.classList.add("status-error");
                errorMessageCell.textContent = "不正确或已失效的API-KEY";
                row.appendChild(errorMessageCell);
            } else {
                let sensitiveIdResult = document.createElement("td");
                sensitiveIdResult.textContent = data[0];
                row.appendChild(sensitiveIdResult);
            }
            tableBody.appendChild(row);

            if (i === apiKeys.length - 1) {
                queriedApiKeys = [];
            }
            serialNumber++; // 增加序列号
            h2.style.display = 'block';
            table.style.display = 'table';

            button.textContent = "查询";
            button.disabled = false;
            button.classList.remove("loading")
        })

    }
}

let apiUrlSelect = document.getElementById("api-url-select");
let customUrlInput = document.getElementById("custom-url-input");

apiUrlSelect.addEventListener("change", function () {
    if (apiUrlSelect.value === "custom") {
        customUrlInput.style.display = "inline-block";
        customUrlInput.style.marginTop = "5px";
    } else {
        customUrlInput.style.display = "none";
    }
});