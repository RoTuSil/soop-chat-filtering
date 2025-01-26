
chrome.storage.local.get('idList', (result) => {
    let idList;
    const input = document.getElementById('item__input');
    const itemList = document.getElementById('itemList');
    if (result.idList) {
        idList = result.idList;
    } else {
        idList = [];
    }
    function loadItems() {
        var n = itemList.childNodes.length
        for(var i = 0; i < n; i++) {
            itemList.removeChild(itemList.childNodes[0]);
        }
        //itemList.childNodes.forEach(item => itemList.removeChild(item));
        idList.forEach(item => {
            
            const li = addList(item,idList)
            // li.textContent = item;
            itemList.appendChild(li);
        });
        console.log('읽어온 idList:', idList);
    }

    document.getElementById('addButton').addEventListener('click', addItem);
    document.getElementById('item__input').addEventListener('keypress', getEnter);
    document.getElementById('export').addEventListener('click', exportList);
    loadItems();
    

    function addItem() {
        const input = document.getElementById('item__input');
        if (input.value.trim() !== '') {
            if (!idList.includes(input.value)) {
                const li = addList(input,idList); 
                itemList.appendChild(li);
                itemList.scrollTo({
                    top: itemList.scrollHeight,
                    behavior: 'smooth'
                  });
                idList.push(input.value);
                chrome.storage.local.set({idList: idList}, function() {
                    console.log('리스트에 "'+input.value+'" 추가');
                });
            } else {
                showNotification("이미 존재하는 ID입니다!");
            }
            input.value = '';
        }
    }

    function getEnter(e) {
        const keyCode = e.code;
        if(keyCode == "Enter") {
            addItem();
        }
    }

    function addList(input,idList) {
        const li = document.createElement('li');
        const table = document.createElement("table");
    
        li.appendChild(table);
    
        const tr = document.createElement('tr');
        table.appendChild(tr);
        table.className = "li-table";
    
        const textTd = document.createElement("td");
        tr.appendChild(textTd);
        textTd.className = "li-id";
    
        const buttonTd = document.createElement("td");
        tr.appendChild(buttonTd);
        buttonTd.className = "li-button";

        
    
        if(input.value)
            textTd.textContent = input.value;
        else textTd.textContent = input
    
        const removeButton = document.createElement('button');
        removeButton.className = "li-remove-button";
        removeButton.onclick = function () {
            const index = idList.indexOf(textTd.textContent);
            if (index > -1) {
                li.classList.add('removing');
                idList.splice(index, 1);
                li.addEventListener('transitionend', (e) => {
                    if(e.propertyName == 'transform') {
                        chrome.storage.local.set({idList: idList}, function() {
                            console.log('리스트 업데이트 됨' , idList);
                        });
                        li.remove();
                    }
                });

            }
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

    document.getElementById('import').addEventListener('click', function() {
        document.getElementById('fileInput').click(); // 파일 입력 요소 클릭
    });
    
    document.getElementById('fileInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
    
        if (!file) return;
    
        const reader = new FileReader();
    
        reader.onload = function(event) {
            try {
                const content = event.target.result;
                let newIdList = JSON.parse(content);
                newIdList.forEach(item => {
                    if (!idList.includes(item)) {
                        idList.push(item);
                    }
                });
                chrome.storage.local.set({idList: idList}, function() {
                    console.log('리스트 업데이트 됨' , idList);
                });
                loadItems();
            } catch(e) {
                console.log(e);
                showNotification("잘못된 파일입니다!");
            }
            
        };
    
        reader.onerror = function(event) {
            showNotification("잘못된 파일입니다!");
            console.error("파일 읽기 오류:", event.target.error);
        };
    
        reader.readAsText(file);
    });
});


chrome.storage.local.get('option', (result) => {
    let option = {};
    const filterManagerCheckbox = document.getElementById('filter-manager');
    const chatLocationCheckbox = document.getElementById('chat-location');

    if(result.option) {
        option = {
            filterManager: result.option.filterManager,
            chatLocation: result.option.chatLocation,
        }
        filterManagerCheckbox.checked = result.option.filterManager;
        chatLocationCheckbox.checked = result.option.chatLocation;
    } else {
        option = {
            filterManager: false,
            chatLocation: false,
        }
        filterManagerCheckbox.checked = false;
        chatLocationCheckbox.checked = false;
    }

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



function showNotification(message) {
    const container = document.querySelector(".error");
    const txt = container.querySelector(".error__title");
    txt.textContent = message;

    
    container.classList.add("show");
  
    setTimeout(() => {
      closeNotification();
    }, 5000);
}

function closeNotification() {
    const container = document.querySelector(".error");
    container.classList.remove("show");
}

document.querySelector(".error__close").addEventListener("click", closeNotification);


