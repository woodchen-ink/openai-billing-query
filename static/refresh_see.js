let serialNumber = 1;

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

function checkBilling(apiKey, apiUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      // 拼接url
      var tokenUrl = `${apiUrl}`;
      var loginUrl = `${apiUrl}/v1/dashboard/onboarding/login`;
      // 使用"/auth/platform/refresh"，潘多拉则需要加上/api
      if (!apiUrl.startsWith("https://ai.fakeopen.com")) {
        tokenUrl += "/api";
      }
      tokenUrl += "/auth/platform/refresh";

      var urlencoded = new URLSearchParams();
      urlencoded.append("refresh_token", apiKey);

      let response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlencoded,
        redirect: "follow",
      });
      const rdata = await response.json();
      if (rdata && rdata.access_token && rdata.refresh_token) {
        // 查询sess
        const get_sess = await fetch(loginUrl, {
          method: "POST", // 设置请求方法为 POST
          headers: {
            Authorization: "Bearer " + rdata.access_token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}), // 此处放置要发送的数据
        });
        const getsessdata = await get_sess.json();
        if (getsessdata && getsessdata.user && getsessdata.user.session) {
          resolve({ token_info: rdata, ...getsessdata });
        } else {
          reject(getsessdata);
        }
      } else {
        reject(rdata);
      }
    } catch (error) {
      reject(error);
    }
  });
}

//查询函数
async function sendRequest() {
  let apiKeyInput = document.getElementById("api-key-input");
  let apiUrlSelect = document.getElementById("api-url-select");
  let customUrlInput = document.getElementById("custom-url-input");

  document
    .getElementById("result-table")
    .getElementsByTagName("tbody")[0].innerHTML = "";
  let apiUrl = apiUrlSelect.value;
  if (apiUrlSelect.value === "custom") {
    apiUrl = customUrlInput.value.trim();
  }
  if (!apiUrl) {
    mdui.alert({
      headline: "无查询线路",
      description: "请选择或自定义配置查询Sess线路",
      confirmText: "OK",
    });
    return;
  } else {
    if (!apiUrl.startsWith("http://") && !apiUrl.startsWith("https://")) {
      apiUrl = "https://" + apiUrl;
    }
    if (apiUrl && apiUrl.endsWith("/")) {
      apiUrl = apiUrl.slice(0, -1); // 去掉末尾的"/"
    }
  }

  let tokenList = apiKeyInput.value.split(/[,\s，\n]+/);
  if (!apiKeyInput.value || tokenList.length === 0) {
    mdui.alert({
      headline: "请输入Token",
      description: "请检查输入refresh_token",
      confirmText: "OK",
    });
    return;
  }

  showLoadingAnimation();

  let tableBody = document.querySelector("#result-table tbody");

  let properties = [
    "email",
    "phone_number",
    "sensitive_id",
    "refresh_token",
    "access_token",
    "created",
  ];

  for (let i = 0; i < tokenList.length; i++) {
    let token = tokenList[i].trim();
    if (token) {
      let row = document.createElement("tr");
      let serialNumberCell = document.createElement("td");
      serialNumberCell.textContent = serialNumber;
      row.appendChild(serialNumberCell);
      try {
        let data = await checkBilling(token, apiUrl);
        let user = data.user;
        let session = user.session;
        let token_info = data.token_info;
        properties.forEach((prop) => {
          let cellValue = "";
          let cell = document.createElement("td");
          if (prop === "created") {
            cellValue = new Date(session["created"] * 1000).toLocaleString();
          } else if (prop === "sensitive_id") {
            cellValue = session[prop]; // 获取 session 对象中的 sensitive_id
            cell.onclick = function () {
              copyCell(cell, `Sensitive ID复制成功`);
            };
          } else if (prop === "refresh_token" || prop === "access_token") {
            cellValue = token_info[prop];
            cell.onclick = function () {
              copyCell(
                cell,
                `${
                  prop === "refresh_token" ? "Refresh Token" : "Access Token"
                }复制成功`
              );
            };
          } else {
            cellValue = user[prop] ? user[prop] : ""; // 确保在user[prop]为空时，cellValue被赋予空字符串
          }

          cell.textContent =
            cellValue && cellValue.length > 50
              ? cellValue.substring(0, 57) + "..."
              : cellValue; // 如果长度超过60，显示"..."
          cell.innerHTML = `<span title="${cellValue}">${cell.textContent}</span>`; // 在悬停时显示全部内容
          row.appendChild(cell);
        });
      } catch (error) {
        let username = document.createElement("td");
        username.textContent = token.replace(/^(.{10}).*(.{8})$/, "$1***$2");
        row.appendChild(username);
        let errorMessageCell = document.createElement("td");
        errorMessageCell.colSpan = "8";
        errorMessageCell.classList.add("status-error");
        // 在这里检查错误信息是否为 "error request login url"
        if (error === "error request login url") {
          errorMessageCell.textContent = "请求错误，请稍后重试";
        } else {
          errorMessageCell.textContent =
            error && error.detail ? error.detail : error;
        }
        row.appendChild(errorMessageCell);
      }

      tableBody.appendChild(row);
      serialNumber++;
    }
  }
  hideLoadingAnimation();
}

function copyCell(cell, message) {
  // 创建一个新的textarea元素
  var textarea = document.createElement("textarea");
  // 设置textarea的值为单元格的文本内容
  textarea.value = cell.innerText;
  // 将textarea元素添加到body中
  document.body.appendChild(textarea);
  // 选择textarea的文本内容
  textarea.select();
  // 执行复制命令
  document.execCommand("copy");
  // 移除textarea元素
  document.body.removeChild(textarea);
  mdui.alert({
    headline: "提示",
    description: message,
    confirmText: "OK",
  });
}

function copyTable() {
  // 这个函数可以保留，以便你仍然可以复制整个表格内容
  var tableBody = document.getElementById("result-tbody");
  var textarea = document.createElement("textarea");
  textarea.value = tableBody.innerText;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  mdui.alert({
    headline: "提示",
    description: "复制成功",
    confirmText: "OK",
  });
}

function copySess() {
  var sensitiveCells = document.querySelectorAll("tbody td:nth-child(4) span"); // 选择所有的Sensitive ID单元格
  var sensitiveIds = Array.from(sensitiveCells).map((cell) => cell.title); // 从单元格中获取所有的Sensitive ID
  var textarea = document.createElement("textarea");
  textarea.value = sensitiveIds.join("\n"); // 用换行符连接所有的Sensitive ID
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  mdui.alert({
    headline: "提示",
    description: "Sensitive ID复制成功",
    confirmText: "OK",
  });
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
