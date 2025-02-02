document.addEventListener('DOMContentLoaded', function() {
    const cardInput = document.getElementById('cardInput');
    const resultSection = document.getElementById('resultSection');

    // 添加输入事件监听
    cardInput.addEventListener('input', function() {
        const content = this.value.trim();
        if (content) {
            const result = parseCardContent(content);
            updateDisplay(result);
        } else {
            // 当输入为空时，重置所有值为 '-' 而不是隐藏结果区域
            const emptyResult = {
                cardType: '-',
                gameType: '-',
                accountType: '-',
                banStatus: '-',
                banTime: '-',
                lobbyLevel: '-',
                gameAccount: '-',
                accountPassword: '-',
                accountId: '-',
                accountUuid: '-',  // 添加 UUID 字段
                bedwarsLevel: '-',
                arcadeCoins: '-',
                mwCoins: '-',
                sbCoins: '-'
            };
            updateDisplay(emptyResult);
        }
    });

    // 解析卡密内容
    // 在 parseCardContent 函数中添加 UUID 字段
    function parseCardContent(content) {
        const result = {
            cardType: '-',
            gameType: '-',
            accountType: '-',
            banStatus: '-',
            banTime: '-',
            lobbyLevel: '-',
            gameAccount: '-',
            accountPassword: '-',
            accountId: '-',
            bedwarsLevel: '-',
            arcadeCoins: '-',
            mwCoins: '-',
            sbCoins: '-'  // 添加 SkyBlock 硬币字段
        };

        // 解析主要信息
        if (content.includes('[Microsoft_Hit]')) result.cardType = '微软账户';
        if (content.includes('[MC]')) result.gameType = 'Minecraft';
        if (content.includes('[XGP]')) result.accountType = 'XGP';
        if (content.includes('[MineCon]')) result.accountType = '含有MineCon披风';
        if (content.includes('[SkyBlock]')) result.accountType = 'SkyBlock';
        
        // 修改封禁状态判断
        if (content.includes('[unban]')) {
            result.banStatus = 'Unban';
            result.banTime = '-';
            result.banStatusNote = '';
        } else if (content.includes('[Banned]')) {
            result.banStatus = 'Banned';
            result.banStatusNote = '';
            // 解析封禁时间
            const banTimeMatch = content.match(/BanTime:(\d+)d\s*(\d+)h\s*(\d+)m\s*(\d+)s/);
            if (banTimeMatch) {
                const [_, days, hours, minutes, seconds] = banTimeMatch;
                result.banTime = `${days}天 ${hours}小时 ${minutes}分 ${seconds}秒`;
            }
        } else if (content.includes('[Nobc]') || !content.includes('[unban]') && !content.includes('[Banned]')) {
            result.banStatus = '未检查封禁状态';
            result.banTime = '-';
            result.banStatusNote = '(当然大部分应该是Unban的)';
        }

        
        // 解析等级信息
        const levelMatch = content.match(/\[(\d+)\]/);
        if (levelMatch) result.lobbyLevel = levelMatch[1];

        // 解析账号信息 - 修改这部分以支持新格式
        const accountMatch = content.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+):([^:|]+)(?::([^|\s]+))?/);
        if (accountMatch) {
            result.gameAccount = accountMatch[1];
            result.accountPassword = accountMatch[2];
            // 如果存在第三部分（游戏ID），则使用它
            if (accountMatch[3]) {
                result.accountId = accountMatch[3];
            } else {
                // 否则尝试原有的 Name: 格式
                const nameMatch = content.match(/Name:([^\s]+)/);
                if (nameMatch) result.accountId = nameMatch[1];
            }
        } else {
            // 如果不匹配新格式，尝试原有的 Name: 格式
            const nameMatch = content.match(/Name:([^\s]+)/);
            if (nameMatch) result.accountId = nameMatch[1];
        }

        // 解析ID
        const nameMatch = content.match(/Name:([^\s]+)/);
        if (nameMatch) result.accountId = nameMatch[1];

        // 解析其他信息
        const bwMatch = content.match(/BW:(\d+)/);
        if (bwMatch) result.bedwarsLevel = bwMatch[1];

        const arcadeMatch = content.match(/Arcade:(\d+)/);
        if (arcadeMatch) result.arcadeCoins = arcadeMatch[1];

        const mwMatch = content.match(/MW_Coins:(\d+)/);
        if (mwMatch) result.mwCoins = mwMatch[1];

        // 添加 SkyBlock 硬币解析
        const sbMatch = content.match(/SB_Coins:(\d+)/);
        if (sbMatch) result.sbCoins = sbMatch[1];

        // 在成功解析到 accountId 后获取 UUID
        if (result.accountId !== '-') {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
        
            // 使用自己的代理服务器
            fetch(`https://api.milkawa.xyz/api/minecraft/uuid/${result.accountId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            })
            .then(async response => {
                clearTimeout(timeoutId);
                if (response.status === 404) {
                    throw new Error('player-not-found');
                }
                if (!response.ok) {
                    throw new Error('network-error');
                }
                const text = await response.text();
                if (!text) {
                    throw new Error('player-not-found');
                }
                return JSON.parse(text);
            })
            .then(data => {
                const uuidElement = document.getElementById('accountUuid');
                if (uuidElement && data && data.id) {
                    uuidElement.textContent = data.id;
                    uuidElement.classList.remove('uuid-error', 'uuid-not-found');
                } else {
                    throw new Error('invalid-data');
                }
            })
            .catch(error => {
                const uuidElement = document.getElementById('accountUuid');
                if (uuidElement) {
                    uuidElement.classList.remove('uuid-error', 'uuid-not-found');
                    if (error.name === 'AbortError') {
                        uuidElement.textContent = '请求超时';
                    } else if (error.message === 'player-not-found') {
                        uuidElement.textContent = '玩家不存在';
                        uuidElement.classList.add('uuid-not-found');
                    } else if (error.message === 'invalid-data') {
                        uuidElement.textContent = '数据无效';
                    } else {
                        console.error('UUID 获取错误:', error);
                        uuidElement.textContent = '网络错误';
                    }
                    uuidElement.classList.add('uuid-error');
                }
            });
        }

        return result;
    }

    // 更新页面显示
    function updateDisplay(result) {
        for (const [key, value] of Object.entries(result)) {
            const element = document.getElementById(key);
            if (element) {
                if (key === 'banStatus') {
                    // 清除之前的提示信息
                    const parentElement = element.parentElement;
                    const oldNote = parentElement.querySelector('.ban-status-note');
                    if (oldNote) {
                        oldNote.remove();
                    }

                    element.textContent = value;
                    element.classList.remove('ban-status-unban', 'ban-status-banned', 'ban-status-nobc');
                    
                    if (value === 'Unban') {
                        element.classList.add('ban-status-unban');
                    } else if (value === 'Banned') {
                        element.classList.add('ban-status-banned');
                    } else if (value === '未检查封禁状态') {
                        element.classList.add('ban-status-nobc');
                        // 添加提示信息
                        if (result.banStatusNote) {
                            const noteSpan = document.createElement('span');
                            noteSpan.className = 'ban-status-note';
                            noteSpan.textContent = result.banStatusNote;
                            element.parentElement.appendChild(noteSpan);
                        }
                    }
                } else {
                    element.textContent = value;
                }
            }
        }
        resultSection.style.display = 'block';
    }

    // 复制功能
    function setupCopyButtons() {
        document.querySelectorAll('.copy-btn').forEach(button => {
            button.addEventListener('click', function() {
                const section = this.dataset.section;
                const singleCopy = this.dataset.copy;
                let textToCopy = '';

                if (singleCopy) {
                    // 复制单个值
                    textToCopy = document.getElementById(singleCopy).textContent;
                } else {
                    // 原有的复制逻辑
                    switch(section) {
                        case 'main':
                            textToCopy = `卡密类型: ${document.getElementById('cardType').textContent}\n` +
                                       `游戏类型: ${document.getElementById('gameType').textContent}\n` +
                                       `账号类型: ${document.getElementById('accountType').textContent}\n` +
                                       `Hypixel封禁情况: ${document.getElementById('banStatus').textContent}\n` +
                                       `封禁剩余时间: ${document.getElementById('banTime').textContent}\n` +
                                       `Hypixel大厅等级: ${document.getElementById('lobbyLevel').textContent}`;
                            break;
                        case 'account':
                            textToCopy = `游戏账号: ${document.getElementById('gameAccount').textContent}\n` +
                                       `账号密码: ${document.getElementById('accountPassword').textContent}\n` +
                                       `账号ID: ${document.getElementById('accountId').textContent}\n` +
                                       `UUID: ${document.getElementById('accountUuid').textContent}`;
                            break;
                        case 'extra':
                            textToCopy = `Bedwars等级: ${document.getElementById('bedwarsLevel').textContent}\n` +
                                       `街机硬币: ${document.getElementById('arcadeCoins').textContent}\n` +
                                       `战墙硬币: ${document.getElementById('mwCoins').textContent}\n` +
                                       `SkyBlock硬币: ${document.getElementById('sbCoins').textContent}`;
                            break;
                        case 'all':
                            textToCopy = `卡密类型: ${document.getElementById('cardType').textContent}\n` +
                                       `游戏类型: ${document.getElementById('gameType').textContent}\n` +
                                       `账号类型: ${document.getElementById('accountType').textContent}\n` +
                                       `Hypixel封禁情况: ${document.getElementById('banStatus').textContent}\n` +
                                       `封禁剩余时间: ${document.getElementById('banTime').textContent}\n` +
                                       `Hypixel大厅等级: ${document.getElementById('lobbyLevel').textContent}\n\n` +
                                       `游戏账号: ${document.getElementById('gameAccount').textContent}\n` +
                                       `账号密码: ${document.getElementById('accountPassword').textContent}\n` +
                                       `账号ID: ${document.getElementById('accountId').textContent}\n` +
                                       `UUID: ${document.getElementById('accountUuid').textContent}\n\n` +
                                       `Bedwars等级: ${document.getElementById('bedwarsLevel').textContent}\n` +
                                       `街机硬币: ${document.getElementById('arcadeCoins').textContent}\n` +
                                       `战墙硬币: ${document.getElementById('mwCoins').textContent}\n` +
                                       `SkyBlock硬币: ${document.getElementById('sbCoins').textContent}`;
                            break;
                    }
                }

                navigator.clipboard.writeText(textToCopy).then(() => {
                    button.classList.add('copied');
                    button.textContent = '已复制';
                    setTimeout(() => {
                        button.classList.remove('copied');
                        button.textContent = singleCopy ? (singleCopy === 'gameAccount' ? '复制账号' : '复制密码') : '复制';
                    }, 2000);
                });
            });
        });
    }

    // 初始化复制按钮
    setupCopyButtons();
    // 获取最新的 commit ID
    fetch('https://api.github.com/repos/Michaelwucoc/account-copier/commits/main')
        .then(response => response.json())
        .then(data => {
            const commitId = document.getElementById('commitId');
            commitId.textContent = data.sha.substring(0, 7); // 只显示前6位
        })
        .catch(error => {
            const commitId = document.getElementById('commitId');
            commitId.textContent = ''; // 出错时不显示
        });
});