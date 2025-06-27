// 상수 선언: 자주 쓰이는 DOM id/class
const ID_INPUT = 'item__input';
const ID_ITEM_LIST = 'itemList';
const ID_ADD_BUTTON = 'addButton';
const ID_EXPORT = 'export';
const ID_IMPORT = 'import';
const ID_FILE_INPUT = 'fileInput';
const ID_FILTER_MANAGER = 'filter-manager';
const ID_CHAT_LOCATION = 'chat-location';
const CLASS_ERROR = 'error';
const CLASS_ERROR_TITLE = 'error__title';
const CLASS_ERROR_CLOSE = 'error__close';

// 팝업이 열릴 때 저장된 idList를 불러와서 UI에 표시
chrome.storage.local.get('idList', (result) => {
    let idList = result.idList || [];
    const input = document.getElementById(ID_INPUT);
    const itemList = document.getElementById(ID_ITEM_LIST);

    // 이벤트 리스너 등록 함수
    function registerEventListeners() {
        document.getElementById(ID_ADD_BUTTON).addEventListener('click', addItem);
        input.addEventListener('keypress', getEnter);
        document.getElementById(ID_EXPORT).addEventListener('click', exportList);
        document.getElementById(ID_IMPORT).addEventListener('click', () => document.getElementById(ID_FILE_INPUT).click());
        document.getElementById(ID_FILE_INPUT).addEventListener('change', handleFileImport);
    }

    // 파일 import 처리 함수
    function handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const content = event.target.result;
                let newIdList = JSON.parse(content);
                newIdList.forEach(item => {
                    if (!idList.includes(item)) idList.push(item);
                });
                chrome.storage.local.set({idList: idList}, () => loadItems());
            } catch(e) {
                showNotification("잘못된 파일입니다!");
            }
        };
        reader.onerror = function() {
            showNotification("잘못된 파일입니다!");
        };
        reader.readAsText(file);
    }

    // idList를 UI에 표시하는 함수
    function loadItems() {
        while (itemList.firstChild) itemList.removeChild(itemList.firstChild);
        if (!idList || idList.length === 0) {
            console.log('읽어온 idList:', idList);
            return;
        }
        idList.forEach(item => {
            const li = createListItem(item);
            if (li) itemList.appendChild(li);
        });
        console.log('읽어온 idList:', idList);
    }

    // id 추가 함수
    function addItem() {
        if (input.value.trim() === '') return;
        if (idList.includes(input.value)) {
            showNotification("이미 존재하는 ID입니다!");
            input.value = '';
            return;
        }
        const li = createListItem(input.value);
        if (li) {
            itemList.appendChild(li);
            itemList.scrollTo({ top: itemList.scrollHeight, behavior: 'smooth' });
            idList.push(input.value);
            chrome.storage.local.set({idList: idList});
        }
        input.value = '';
    }

    // 엔터키 입력 시 addItem 호출
    function getEnter(e) {
        if(e.code !== "Enter") return;
        addItem();
    }

    // id 항목을 리스트에 추가하는 함수 (생성만 담당)
    function createListItem(id) {
        if (!id) return null;
        const li = document.createElement('li');
        const table = document.createElement("table");
        const tr = document.createElement('tr');
        const textTd = document.createElement("td");
        const buttonTd = document.createElement("td");
        li.appendChild(table);
        table.appendChild(tr);
        tr.appendChild(textTd);
        tr.appendChild(buttonTd);
        table.className = "li-table";
        textTd.className = "li-id";
        buttonTd.className = "li-button";
        textTd.textContent = id;
        // 삭제 버튼 생성
        const removeButton = document.createElement('button');
        removeButton.className = "li-remove-button";
        removeButton.onclick = function () {
            const index = idList.indexOf(id);
            if (index === -1) return;
            li.classList.add('removing');
            idList.splice(index, 1);
            li.addEventListener('transitionend', (e) => {
                if(e.propertyName == 'transform') {
                    chrome.storage.local.set({idList: idList});
                    li.remove();
                }
            });
        }
        const removeText = document.createElement('span');
        removeText.textContent = '삭제';
        removeText.className = "remove-text";
        removeButton.appendChild(removeText);
        const removeIcon = document.createElement('span');
        removeIcon.className = "remove-icon";
        removeIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z"></path></svg>';
        removeButton.appendChild(removeIcon);
        buttonTd.appendChild(removeButton);
        return li;
    }

    // idList를 파일로 내보내기
    function exportList() {
        var list = JSON.stringify(idList);
        const blob = new Blob([list], {type: 'text/csv'});
        var url = URL.createObjectURL(blob);
        var now = new Date();
        chrome.downloads.download({
            url:url,
            filename: `filtering-${now.getTime().toString()}.txt`,
        });
    }

    registerEventListeners();
    loadItems();
});

// 옵션(설정) 불러오기 및 UI 반영
chrome.storage.local.get('option', (result) => {
    let option = result.option || { filterManager: false, chatLocation: false };
    const filterManagerCheckbox = document.getElementById(ID_FILTER_MANAGER);
    const chatLocationCheckbox = document.getElementById(ID_CHAT_LOCATION);
    filterManagerCheckbox.checked = option.filterManager;
    chatLocationCheckbox.checked = option.chatLocation;
    filterManagerCheckbox.addEventListener('change', function() {
        option.filterManager = filterManagerCheckbox.checked;
        saveOption();
    });
    chatLocationCheckbox.addEventListener('change', function() {
        option.chatLocation = chatLocationCheckbox.checked;
        saveOption();
    });
    function saveOption() {
        chrome.storage.local.set({option: option}, function() {
            console.log('설정 업데이트 됨 : ', option);
        });
    }
});

// 에러/알림 메시지 표시 함수
function showNotification(message) {
    if (!message) return;
    const container = document.querySelector(`.${CLASS_ERROR}`);
    if (!container) return;
    const txt = container.querySelector(`.${CLASS_ERROR_TITLE}`);
    if (!txt) return;
    txt.textContent = message;
    container.classList.add("show");
    setTimeout(() => {
      closeNotification();
    }, 5000);
}

// 에러/알림 메시지 닫기 함수
function closeNotification() {
    const container = document.querySelector(`.${CLASS_ERROR}`);
    if (!container) return;
    container.classList.remove("show");
}

// 닫기 버튼 이벤트 리스너
// 옵셔널 체이닝으로 안전하게 이벤트 등록

document.querySelector(`.${CLASS_ERROR_CLOSE}`)?.addEventListener("click", closeNotification);


