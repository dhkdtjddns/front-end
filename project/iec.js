document.addEventListener("DOMContentLoaded", () => {
    const menuItems = document.querySelectorAll(".menu-item"); // 모든 메뉴 아이템 요소
    const menuContainer = document.querySelector(".menu"); // 메뉴 컨테이너
    const cart = document.querySelector(".cart"); // 장바구니 컨테이너
    const cartItemsList = document.querySelector(".cart-items"); // 장바구니 아이템 목록
    const checkoutButton = document.querySelector(".checkout"); // 결제 버튼
    const totalPriceSpan = document.getElementById("total-price"); // 총 가격 표시 요소
    const emptyMessage = document.querySelector(".empty-message"); // 장바구니 비어있을 때 메시지
    const receiptSection = document.querySelector(".receipt"); // 영수증 섹션
    const receiptList = document.getElementById("receipt-list"); // 영수증 항목 목록

    const salesList = document.getElementById("sales-list"); // 판매 내역 리스트
    const totalSalesSpan = document.getElementById("total-sales"); // 총 판매 금액 표시 요소

    let cartItems = []; // 장바구니 아이템 배열
    let totalPrice = 0; // 총 금액
    let totalSales = 0; // 총 판매 금액

    // 메뉴 아이템에 대한 드래그 시작 이벤트
    menuItems.forEach(item => {
        item.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text", JSON.stringify({
                id: item.dataset.id, // 아이템 ID
                name: item.dataset.name, // 아이템 이름
                price: parseInt(item.dataset.price), // 아이템 가격
            }));
            setTimeout(() => item.style.display = "none", 0); // 드래그 시작 시 아이템 숨기기
        });
    });

    // 장바구니에 드래그된 아이템을 추가하는 이벤트
    cart.addEventListener("dragover", (e) => e.preventDefault());
    cart.addEventListener("drop", (e) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData("text")); // 드래그된 아이템 정보
        const existingItem = cartItems.find(item => item.id === data.id); // 장바구니에 이미 있는지 확인

        if (existingItem) {
            existingItem.quantity += 1; // 이미 있으면 수량 증가
        } else {
            cartItems.push({ ...data, quantity: 1 }); // 없으면 새로 추가
        }

        // 메뉴에서 해당 아이템 제거
        const menuItem = document.querySelector(`.menu-item[data-id="${data.id}"]`);
        if (menuItem) {
            menuItem.style.display = "none"; // 메뉴 목록에서 해당 아이템 숨기기
        }

        updateCart(); // 장바구니 업데이트
    });

    // 메뉴에서 장바구니로 이동하는 이벤트
    menuContainer.addEventListener("dragover", (e) => e.preventDefault());
    menuContainer.addEventListener("drop", (e) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData("text")); // 드래그된 아이템 정보
        const itemIndex = cartItems.findIndex(item => item.id === data.id); // 장바구니에서 아이템 찾기

        if (itemIndex !== -1) {
            cartItems.splice(itemIndex, 1); // 장바구니에서 제거

            // 메뉴로 아이템 복구
            const menuItem = document.querySelector(`.menu-item[data-id="${data.id}"]`);
            if (menuItem) {
                menuItem.style.display = "block"; // 메뉴 목록에 복귀
            }
        }
        updateCart(); // 장바구니 업데이트
    });

    // 장바구니 UI 업데이트 함수
    function updateCart() {
        cartItemsList.innerHTML = ""; // 장바구니 목록 초기화
        cartItems.forEach(item => {
            const li = document.createElement("li");
            li.dataset.id = item.id; // 아이템 ID
            li.setAttribute("draggable", "true"); // 드래그 가능 설정
            li.innerHTML = `
                ${item.name} - ${item.price}원
                <button class="decrease">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="increase">+</button>
                <button class="remove">삭제</button>
                <span class="subtotal">소계: ${item.price * item.quantity}원</span>
            `;
            cartItemsList.appendChild(li);

            // 드래그 이벤트
            li.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text", JSON.stringify({ id: item.id }));
            });

            // 수량 증가/감소 이벤트
            li.querySelector(".decrease").addEventListener("click", () => {
                if (item.quantity > 1) {
                    item.quantity -= 1; // 수량 감소
                } else {
                    cartItems = cartItems.filter(cartItem => cartItem.id !== item.id); // 수량 0이면 삭제
                }
                updateCart(); // 장바구니 업데이트
            });

            li.querySelector(".increase").addEventListener("click", () => {
                item.quantity += 1; // 수량 증가
                updateCart(); // 장바구니 업데이트
            });

            // 메뉴 삭제 버튼
            li.querySelector(".remove").addEventListener("click", () => {
                cartItems = cartItems.filter(cartItem => cartItem.id !== item.id); // 장바구니에서 삭제
                updateCart(); // 장바구니 업데이트

                // 삭제된 메뉴를 메뉴 목록에 다시 추가
                const menuItem = document.querySelector(`.menu-item[data-id="${item.id}"]`);
                if (menuItem) {
                    menuItem.style.display = "block"; // 메뉴 목록에 보이게
                }
            });
        });

        // 총액 업데이트
        totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0); // 총액 계산
        totalPriceSpan.textContent = totalPrice; // 총액 표시

        // 장바구니 상태에 따른 UI 조정
        emptyMessage.style.display = cartItems.length === 0 ? "block" : "none"; // 장바구니가 비어있으면 메시지 보이기
        checkoutButton.disabled = cartItems.length === 0; // 장바구니가 비어있으면 결제 버튼 비활성화
    }

    // 결제 버튼 클릭 시 영수증 표시 및 판매 내역 업데이트
    checkoutButton.addEventListener("click", () => {
        receiptList.innerHTML = ""; // 기존 영수증 내용 초기화
        cartItems.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `${item.name} - ${item.price}원 x ${item.quantity}개`;
            receiptList.appendChild(li);
        });
        document.getElementById("total-price").textContent = totalPrice;
        receiptSection.classList.remove("hidden"); // 영수증 섹션 표시

        // 판매 내역 갱신
        cartItems.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `${item.name} - ${item.price}원 x ${item.quantity}개`;
            salesList.appendChild(li);
        });

        // 총 판매 금액 갱신
        totalSales += totalPrice;
        totalSalesSpan.textContent = totalSales;

        // 화면 초기화 (장바구니 및 메뉴)
        setTimeout(() => {
            cartItems = []; // 장바구니 초기화
            updateCart(); // 장바구니 UI 업데이트
            salesList.innerHTML = ""; // 판매 내역 초기화

            // 메뉴 아이템을 다시 보여주기
            menuItems.forEach(item => {
                item.style.display = "block"; // 메뉴 목록에 아이템 보이게
            });
        }, 3000); // 3초 후에 초기화
    });

    // 판매 내역 초기화 버튼 클릭
    const clearSalesLogButton = document.getElementById("clear-sales-log");
    clearSalesLogButton.addEventListener("click", () => {
        salesList.innerHTML = ""; // 판매 내역 초기화
        totalSales = 0; // 총 판매 금액 초기화
        totalSalesSpan.textContent = totalSales; // 총 판매 금액 표시
    });

    // 메뉴 추가 기능
    const addMenuButton = document.getElementById("add-menu");
    addMenuButton.addEventListener("click", () => {
        const menuName = document.getElementById("menu-name").value.trim();
        const menuPrice = document.getElementById("menu-price").value.trim();

        if (menuName && menuPrice) {
            // 새로운 메뉴 아이템을 메뉴 목록에 추가하지 않음
            // 대신, 장바구니에만 추가
            cartItems.push({ id: menuName, name: menuName, price: parseInt(menuPrice), quantity: 1 });
            updateCart(); // 장바구니 업데이트
        }
    });

    // 메뉴 삭제 기능
    const deleteMenuButton = document.getElementById("delete-menu");
    deleteMenuButton.addEventListener("click", () => {
        const menuName = document.getElementById("menu-name").value.trim();

        if (menuName) {
            // 장바구니에서 해당 메뉴 아이템 삭제
            cartItems = cartItems.filter(item => item.name !== menuName);
            updateCart(); // 장바구니 업데이트
        }
    });
});
