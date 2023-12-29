let serialNumber = 1;

function checkBilling(apiKey, apiUrl) {
  return new Promise(async (resolve, reject) => {
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const urlGetsess = `${apiUrl}/api/auth/platform/login`;
    var urlencoded = new URLSearchParams();
    for (var i in apiKey) {
      urlencoded.append(i, apiKey[i]);
    }

    try {
      const response = await axios.post(urlGetsess, urlencoded, {
        headers: headers,
        maxRedirects: 0,
      });

      const getsessdata = response.data;
      if (getsessdata && getsessdata.login_info && getsessdata.token_info) {
        resolve(getsessdata); // 返回getsessdata对象
      } else {
        reject(getsessdata);
      }
    } catch (error) {
      reject(error);
    }
  });
}


//查询函数
async function sendRequest() {
  let apiKeyInput = document.getElementById("api-key-input");
  let customUrlInput = document.getElementById("custom-url-input");

  document
    .getElementById("result-table")
    .getElementsByTagName("tbody")[0].innerHTML = "";

  let apiUrl = customUrlInput.value.trim();
  if (apiUrl.endsWith('/')) {
    apiUrl = apiUrl.slice(0, -1); // 去掉末尾的"/"
  }
  let userList = apiKeyInput.value.split(/[,\s，\n]+/);
  if (!apiUrl) {
    mdui.alert({
      headline: "无查询线路",
      description: "请输入PandoraNext Api的地址",
      confirmText: "OK",
    });
    return;
  } else if (!apiUrl.startsWith("http://") && !apiUrl.startsWith("https://")) {
    apiUrl = "https://" + apiUrl;
  }

  if (userList.length === 0) {
    mdui.alert({
      headline: "请检查输入内容",
      description: "请填写账户信息",
      confirmText: "OK",
    });
    return;
  }

  let userData = [];
  for (var i = 0; i < userList.length; i++) {
    var userInfo = userList[i].split(/\|/);
    if (userInfo.length > 3 || userInfo.length < 2) {
      mdui.alert({
        headline: "请检查输入内容",
        description: "请按格式输入账户信息",
        confirmText: "OK",
      });
      return;
    }
    userData.push({
      username: userInfo[0],
      password: userInfo[1],
      mfa_code: userInfo[2] ? userInfo[2] : "",
      prompt: "login",
    });
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
  for (let i = 0; i < userData.length; i++) {
    let userInfo = userData[i];
    let row = document.createElement("tr");
    let serialNumberCell = document.createElement("td");
    serialNumberCell.textContent = serialNumber;
    row.appendChild(serialNumberCell);

    try {
      let data = await checkBilling(userInfo, apiUrl);
      let user = data.login_info.user;
      let session = user.session;
      let token_info = data.token_info;
      let cell = document.createElement("td");
      let cellValue = '';
      properties.forEach((prop) => {
        console.log(prop);
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
            copyCell(cell, `${prop === "refresh_token" ? 'Refresh Token' : 'Access Token'}复制成功`);
          };
        } else {
          cellValue = user[prop] ? user[prop] : ''; // 确保在user[prop]为空时，cellValue被赋予空字符串
        }
      
        cell.textContent = cellValue && cellValue.length > 50 ? cellValue.substring(0, 57) + "..." : cellValue; // 如果长度超过60，显示"..."
        cell.innerHTML = `<span title="${cellValue}">${cell.textContent}</span>`; // 在悬停时显示全部内容
        row.appendChild(cell);
      });
    } catch (error) {
      let username = document.createElement("td");
      username.textContent = userInfo.username;
      row.appendChild(username);
      let errorMessageCell = document.createElement("td");
      errorMessageCell.colSpan = "8";
      errorMessageCell.classList.add("status-error");
      // 在这里检查错误信息是否为 "error request login url"
      if (error === 'error request login url') {
        errorMessageCell.textContent = '请求错误，请稍后重试';
      } else {
        errorMessageCell.textContent = error && error.detail ? error.detail : error;
      }
      row.appendChild(errorMessageCell);
    }

    tableBody.appendChild(row);
    serialNumber++;
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
