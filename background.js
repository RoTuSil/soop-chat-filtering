chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'filterSelected',
        title: '해당 유저 필터링에 추가',
        type: 'normal',
        contexts: ['all'],
        documentUrlPatterns: [
            "https://play.sooplive.co.kr/*",
            "https://vod.sooplive.co.kr/player/*"
        ]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'filterSelected') {
        chrome.tabs.sendMessage(tab.id, { action: 'filterSelected' });
    }
});