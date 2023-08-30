// 定义一个异步函数来发送请求
async function sendRequest() {
    //获取用户输入的账号和密码
    let input = document.getElementById('api-key-input').value.split('\n');
    let users = input.map(user => {
        const [username, password] = user.split(' --- ');
        return { username, password };
    });

    //获取前一天的日期
    let day = new Date();
    day.setDate(day.getDate() - 1);
    let yesterday = day.toISOString().slice(0, 10).replace(/-/g, '');

    for (let i = 0; i < users.length; i++) {
        let user = users[i];

        //发送第一个请求
        const response1 = await fetch('https://ai-' + yesterday + '.fakeopen.com/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': `https://ai-${yesterday}.fakeopen.com`,
                'Referer': `https://ai-${yesterday}.fakeopen.com/auth1`
            },
            body: new URLSearchParams({
                username: user.username,
                password: user.password,
                mfa_code: ''
            }),
        });

        const data1 = await response1.json();
        const accessToken = data1.access_token;

        //发送第二个请求
        const response2 = await fetch('https://ai.fakeopen.com/dashboard/onboarding/login', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
            },
        });

        const data2 = await response2.json();

        //打印结果到 #result 表格
        let result = document.getElementById('result');
        result.style.visibility = 'visible';
        result.innerHTML += `<tr><td>${i + 1}</td><td>${data2.user.email}</td><td>${data2.user.id}</td><td>${data2.user.session.sensitive_id}</td></tr>`;
    }

    //显示结果标题
    document.getElementById('result-head').style.visibility = 'visible';

    //为每个用户添加一个按钮，点击复制 sensitive_id
    let button = document.createElement('button');
    button.innerText = '复制 sensitive_id';
    document.body.appendChild(button);
    let sensitive_ids = Array.from(document.getElementById('result').querySelectorAll('tr td:nth-child(4)')).map(td => td.innerText);
    button.addEventListener('click', function () {
        let copyText = sensitive_ids.join('\n');
        navigator.clipboard.writeText(copyText)
            .then(() => {
                alert('Copied!');
            })
            .catch(err => {
                alert('Error in copying text: ', err);
            });
    });
}
