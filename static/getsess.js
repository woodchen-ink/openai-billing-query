let queriedApiKeys = [];
let serialNumber = 1;

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

async function checkBilling(apiKey, apiUrl) {
    const headers = {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
    };
    const urlGetsess = `${apiUrl}/dashboard/onboarding/login`;

    try {
        const response = await fetch(urlGetsess, {
            method: "POST", // 设置请求方法为 POST
            headers: headers,
            body: JSON.stringify({}) // 此处放置要发送的数据
        });

        const getsessdata = await response.json();
        console.log(getsessdata);
        if (getsessdata && getsessdata.user && getsessdata.user.session) {
            return getsessdata;  // 直接返回整个getsessdata对象
        } else {
            console.error("Unexpected data structure: user or session property not found in the response.", getsessdata);
            return null;
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}

//查询函数
async function sendRequest() {

    let apiKeyInput = document.getElementById("api-key-input");
    let apiUrlSelect = document.getElementById("api-url-select");
    let customUrlInput = document.getElementById("custom-url-input");
    let table = document.getElementById("result-table");
    let h2 = document.getElementById("result-head");

    if (apiKeyInput.value.trim() === "") {
        alert("请填写API KEY");
        return;
    }

    document.getElementById("result-table").getElementsByTagName('tbody')[0].innerHTML = "";

    let apiUrl = "";
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

    let apiKeys = apiKeyInput.value.split(/[,\s，\n]+/);

    if (apiKeys.length === 0) {
        mdui.alert({
            headline: "未匹配到 access_token",
            description: "请检查输入内容",
            confirmText: "OK",
        })
        return;
    }

    mdui.alert({
        headline: "成功匹配到 access_token",
        description: apiKeys,
        confirmText: "OK",
    });

    showLoadingAnimation();

    let tableBody = document.querySelector("#result-table tbody");
    for (let i = 0; i < apiKeys.length; i++) {
        let apiKey = apiKeys[i].trim();

        let data = await checkBilling(apiKey, apiUrl); // 获取 checkBilling 的结果

        let row = document.createElement("tr");

        let serialNumberCell = document.createElement("td");
        serialNumberCell.textContent = serialNumber;
        row.appendChild(serialNumberCell);

        let apiKeyCell = document.createElement("td");
        apiKeyCell.textContent = apiKey.replace(/^(.{10}).*(.{8})$/, "$1***$2");
        row.appendChild(apiKeyCell);

        if (data.user && data.user.session) {
            let user = data.user;
            let session = user.session;
            let ip_country = data.ip_country;

            let orgId = user.orgs.data[0].id;

            let properties = ['id', 'email', 'name', 'phone_number', 'created', 'sensitive_id', 'session_created', orgId, 'ip_country'];
            properties.forEach(prop => {
                let cell = document.createElement("td");
                if (prop === 'created' || prop === 'session_created') {
                    let timestamp = prop === 'created' ? user[prop] : session['created'];
                    cell.textContent = new Date(timestamp * 1000).toLocaleString();
                } else if (prop === 'sensitive_id') {
                    cell.textContent = session[prop]; // 获取 session 对象中的 sensitive_id
                } else if (prop === orgId) {
                    cell.textContent = orgId; // 直接使用 orgId 变量
                } else if (prop === 'ip_country') {
                    cell.textContent = ip_country ? ip_country : 'N/A'; // 改为使用 ip_country 变量
                } else {
                    cell.textContent = user[prop];
                }
                row.appendChild(cell);
            });

        } else {
            // 接口返回的数据结构不符合预期
            console.error("Unexpected data structure: data[0] or data.user is undefined.");
            let errorMessageCell = document.createElement("td");
            errorMessageCell.colSpan = "8";
            errorMessageCell.classList.add("status-error");
            errorMessageCell.textContent = "不正确或已失效的API-KEY";
            row.appendChild(errorMessageCell);
        }

        tableBody.appendChild(row);

        if (i === apiKeys.length - 1) {
            queriedApiKeys = [];
        }
        serialNumber++;
    }
    hideLoadingAnimation();
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

let isOpen = true;

toggleButton.addEventListener("click", () => {
    isOpen = !isOpen;
    if (isOpen) {
        navigationDrawer.open = true;
    } else {
        navigationDrawer.open = false;
    }
});