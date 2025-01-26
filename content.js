const container = document.querySelector('.chatting-item-wrap');

const style = document.createElement('style');
style.textContent = `
    body {
        margin: 0;
        font-family: Arial, sans-serif;
    }

    .container {
        width: 300px;
        height: 400px; /* 고정된 높이 */
        margin: 50px auto;
        display: flex;
        flex-direction: column;
    }

    .resizer {
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: ns-resize;
        height: 15px;
        vertical-align: middle;
    }
    .resizer hr {
        background-color: silver;
        width: 100%;
    }

    .filterBox {
        z-index: 1;
    }
    
    .chatbox .actionbox .chat_item_list .item_box li.capture a {
        background-image: url('${chrome.runtime.getURL('capture.svg')}');
        background-size: 70% 70%;

    }
`;
document.head.appendChild(style);

let SVG = [];
let gudok = [];

let idList = [];
let option = [];
// 상단 Div 생성

const chat = document.querySelector('.chatting-viewer')
//const filtered = document.createElement('div');
const filtered = chat.cloneNode(true);

// resizer 생성
const resizer = document.createElement('div');
resizer.appendChild(document.createElement('hr'));
resizer.classList.add('resizer');
filtered.classList.add('filterBox');
filtered.id = 'Filtered-chat';

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.idList) {
        idList = changes.idList.newValue;
        console.log('idList가 업데이트되었습니다:', idList);
        // Perform any actions needed when idList updates

    }
    if (areaName === 'local' && changes.option) {
        option = changes.option.newValue;
        console.log('option이 업데이트되었습니다:', option);
        // Perform any actions needed when idList updates
    }

});


chrome.storage.local.get('option', (result) => {
    console.log('읽어온 option:', result.option);
    if (result.option) {
        option = result.option;
        // 여기서 option을 사용하여 필요한 작업을 수행하세요.
    } else {
        option = {
            filterManager: false,
            chatLocation: false,
        }
    }
    if(option.chatLocation) {
        console.log("상단에 위치");
        container.appendChild(resizer);
        container.appendChild(filtered);
    } else {
        console.log("하단에 위치");
        container.insertBefore(resizer, container.firstChild);
        container.insertBefore(filtered, container.firstChild);
    }

})



resizer.addEventListener('mousedown', (event) => {
    event.preventDefault();
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResize);
});
function resize(event) {
    const containerRect = container.getBoundingClientRect();
    const newHeight = (event.clientY  - containerRect.top) / containerRect.height;
    
    // 상한 및 하한 설정
    if (newHeight > .1 && newHeight < .9) {

        if(option.chatLocation) {
            filtered.style.height = ((1 - newHeight)*100) + '%';
            chat.style.height = (newHeight*100) + '%';
        } else {
            filtered.style.height = (newHeight*100) + '%';
            chat.style.height = ((1 - newHeight)*100) + '%';

        }


        chrome.storage.local.set({ resizeHeight: newHeight });

        //bottomDiv.style.height = (containerRect.height - newHeight - resizer.offsetHeight) + 'px';
    }
}

function stopResize() {
    window.removeEventListener('mousemove', resize);
    window.removeEventListener('mouseup', stopResize);
}
chrome.storage.local.get('resizeHeight', (result) => {
    if(option.chatLocation) {
        if (result.resizeHeight) {
            console.log('읽어온 resizeHeight:', result.resizeHeight);
            // 여기서 resizeHeight를 사용하여 필요한 작업을 수행하세요.
            filtered.style.height = ((1 - result.resizeHeight)*100) + '%';
            chat.style.height = (result.resizeHeight*100) + '%';
        } else {
            filtered.style.height = '60%';
            chat.style.height = '40%';
        }
    } else {
        if (result.resizeHeight) {
            console.log('읽어온 resizeHeight:', result.resizeHeight);
            // 여기서 resizeHeight를 사용하여 필요한 작업을 수행하세요.
            filtered.style.height = (result.resizeHeight*100) + '%';
            chat.style.height = ((1 - result.resizeHeight)*100) + '%';
        } else {
            filtered.style.height = '40%';
            chat.style.height = '60%';
        }
    }
});




chrome.storage.local.get('idList', (result) => {
    if (result.idList) {
        console.log('읽어온 idList:', result.idList);
        // 여기서 idList를 사용하여 필요한 작업을 수행하세요.
        // .live-area 요소를 선택합니다.
        const liveArea = chat;
        
        idList = result.idList;

        // MutationObserver를 생성합니다.
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if(mutation.addedNodes.length > 50) {
                    console.log(mutation.addedNodes.length);
                }
                // 추가된 노드가 있을 경우
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        // 추가된 노드가 chatting-list-item인지 확인합니다.
                        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('chatting-list-item')) {
                            //if(node.classList)
                            if(node.querySelector(".message-container")) {
                                button = node.querySelector("button");
                                //button.style.width = "50%";
                                for(;filtered.childNodes.length>50;) {
                                    filtered.childNodes[0].remove();
                                }

                                const copied = node.cloneNode(true);

                                const userIdButton = copied.querySelector('button')
                                if(userIdButton == null) return;
                                userId = userIdButton.getAttribute('user_id').replace(/\(.*$/, '');
                                var isManager = userIdButton.getAttribute('grade') == 'manager';
                                //var chatText = copied.querySelector('p').textContent;
                                
                                
                                // //!
                                // filtered.appendChild(copied);
                                // filtered.scrollTop = filtered.scrollHeight;
                                // //!

                                if(idList.includes(userId) || (option.filterManager && isManager)) {    
                                    filtered.appendChild(copied);
                                    filtered.scrollTop = filtered.scrollHeight;
                                }
                            }
                        }
                    });
                }
            });
        });
        observer.observe(liveArea, {
            childList: true,  // 자식 노드의 추가/제거를 감지합니다.
            subtree: true     // 하위 노드에서도 감지를 활성화합니다.
        });
    }
    else {
        console.log('idList가 없습니다.');
    }
});


//캡쳐 버튼 추가
const tempLi = document.createElement('li');
const captureButton = document.createElement('a');
tempLi.classList.add('capture');
captureButton.textContent = '캡쳐';
captureButton.setAttribute('tip', '채팅 필터 캡쳐');
tempLi.appendChild(captureButton);
document.querySelector('.item_box').appendChild(tempLi);



let time;

captureButton.addEventListener('click', () => {
    downLoadFilteredChat();
});

async function downLoadFilteredChat() {
    await changeImageURLtoBase64(filtered);
    html2canvas(filtered, {
        allowTaint: false,
        useCORS: false,
        ignoreElements: (element) => element.tagName === 'VIDEO'
    }).then(canvas => {
        canvas.toBlob(blob => {
            const link = document.createElement('a');
            link.download = `${new Date().getTime()}.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            link.remove();
        });
    });
}

async function changeImageURLtoBase64(container) {
    const imgAll = container.querySelectorAll('img');
    
    // imgAll에서 img가 data:image인 경우 제외
    const imgList = Array.from(imgAll).filter(img => !img.src.startsWith('data:image'));

    const svgList = Array.from(container.querySelectorAll("span")).filter(
        span => span.classList.contains("grade-badge-fan")
    );
    const svgPromises = svgList.map(async svg => {
        const backgroundImage =  window.getComputedStyle(svg).backgroundImage;
        const svgData = backgroundImage.replace(/url\("data:image\/svg\+xml,(.*)"\)/, '$1');
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.innerHTML = decodeURIComponent(svgData);
        svgElement.setAttribute('width', '15px');
        svgElement.setAttribute('height', '15px');
        svg.parentNode.replaceChild(svgElement, svg);
    });
    const imgPromises = imgList.map(async img => {
        const srcName = (new URL(img.src).origin + new URL(img.src).pathname).toString();
        // 기존 src에서 쿼리 스트링을 제거
        img.src = srcName;

        // 이미지가 이미 변환된 경우 처리
        if (gudok[srcName]) {
            img.src = gudok[srcName];
            return;
        }

        // 캐시를 방지하기 위해 src에 타임스탬프 추가
        img.src += "?v=" + new Date().getTime();

        // 한 번만 변환하려면 한 번에 여러 이미지를 변환하는 방식
        if (!gudok[srcName]) {
            try {
                // 변환 작업을 병렬로 시작
                let response = await fetch(img.src);
                const blob = await response.blob();

                // Blob을 DataURL로 변환
                const dataurl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });

                // 변환된 이미지 src 저장
                gudok[srcName] = dataurl; // 변환된 URL을 저장
                img.src = dataurl; // 이미지 src 업데이트
            } catch (error) {
                console.error("이미지 변환 중 오류 발생:", error);
            }
        }
    });

    // 모든 이미지에 대해 비동기 작업을 병렬로 처리
    await Promise.all(imgPromises);
    await Promise.all(svgPromises);
}

document.addEventListener('contextmenu', (event) => {
    // 우클릭된 요소를 저장
    const targetElement = event.target;
    window.__clickedElement = targetElement; // 전역에 저장
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'filterSelected') {
        if (window.__clickedElement) {
            let id = window.__clickedElement.parentNode.getAttribute('user_id');
            if(id) {
                console.log('우클릭된 요소 정보:', id);
                let idOrigin = id.replace(/\(.*$/, '');
                if(idList.includes(idOrigin)) {
                    console.log('이미 존재하는 id');
                    return;
                }
                idList.push(idOrigin);
                chrome.storage.local.set({idList: idList}, function() {
                    console.log(`리스트에 ${id} 추가됨`);
                });
            } else {
                console.log("id가 없음");
            }
        } else {
            console.log('우클릭된 요소 정보가 없음');
        }
    }
});


