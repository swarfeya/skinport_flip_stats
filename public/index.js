/**
 * @typedef {Object} Purchase
 * @property {number} id - The unique identifier for the purchase.
 * @property {string} type - The type of transaction, e.g., "purchase".
 * @property {string|null} sub_type - The sub-type of the transaction, if any.
 * @property {string} status - The status of the transaction, e.g., "complete".
 * @property {number} amount - The amount of the transaction.
 * @property {number|null} fee - The fee associated with the transaction, if any.
 * @property {string} currency - The currency of the transaction, e.g., "EUR".
 * @property {Array.<Item>} items - The items involved in the transaction.
 * @property {string} created_at - The ISO 8601 date string when the transaction was created.
 * @property {string} updated_at - The ISO 8601 date string when the transaction was last updated.
 */

/**
 * @typedef {Object} Item
 * @property {number} asset_id - The unique identifier for the asset.
 * @property {number} sale_id - The unique identifier for the sale.
 * @property {string} market_hash_name - The market hash name of the item.
 * @property {number} amount - The amount of the item.
 * @property {string} currency - The currency of the item, e.g., "EUR".
 * @property {string} buyer_country - The country of the buyer.
 * @property {string} seller_country - The country of the seller.
 */



let infos = JSON.parse(window.localStorage.getItem("api_info"));

/**
 * @type {Item[]}
 */
let itemlist = infos.filter(a => a.status == "complete" && a.items).map(purchase => {
    let feePercentage;
    if (purchase.type == "credit") {
        feePercentage = purchase.fee / purchase.amount;
        if (feePercentage > 0.11 && feePercentage < 0.13) {
            feePercentage = 0.12;
        }
    }
    purchase.items.forEach(purchased_item => {
        if (purchase.type == "credit") {
            purchased_item.fee = clampPrice(purchased_item.amount*feePercentage);
        }
        purchased_item.type = purchase.type
    });
    return purchase.items;
}).flat();

function clampPrice(price) {
    return Math.ceil(price*100)/100;
}

async function getPage(page, limit=100) {
    let clientId = document.querySelector("#clientId").value;
    let secret = document.querySelector("#api_secret").value;
    const params = new URLSearchParams({
        clientId,
        secret,
        page,
        limit
    });
    const response = await fetch(`http://localhost:3000/transactions?${params}`, {
        method: 'GET',
        headers: {
            'Accept-Encoding': 'br'
        }
    });

    const data = await response.json();
    // console.log(data);
    return data;
};
// document.cookie.

async function fetchApiInfo() {
    let item_amount_info = await getPage(1, 1);
    if (item_amount_info.errors && item_amount_info.errors.length) {
        alert(item_amount_info.errors.map(a => a.message).join("\n"))
        return;
    } 
    item_amount_info.fetchTime = new Date().getTime();
    window.localStorage.setItem("amount_info", JSON.stringify(item_amount_info));
    infos = []
    for (let i = 1; i <= Math.ceil(item_amount_info.pagination.pages/100); i++) {
        let info = await getPage(i);
        console.log(info)
        infos.push(...info.data)
    }
    window.localStorage.setItem("api_info", JSON.stringify(infos))
    alert("Successfully reloaded the list!")
}



/** @param {Item} item_purchase  */
function getDOMElementPurchase(item_purchase, index) {
    /**
     * @type {Purchase[]}
     */


    // if (purchase.)
    /**        <li class="purchase profitable">
            <span class="purchase_info">Item Name: AK-47 | Buy Price: $100</span>
            <span class="sell_info">Sell Price: $150 | Profit: $50</span>
        </li>
        <li class="purchase not_profitable">
            <span class="purchase_info">Item Name: M4A1-S | Buy Price: $200</span>
            <span class="sell_info">Sell Price: $180 | Profit: -$20</span>
        </li>
    */
    const li = document.createElement('li');
    // li.className = purchase.amount > 0 ? 'purchase profitable' : 'purchase not_profitable';

    const purchaseInfo = document.createElement('span');
    purchaseInfo.className = 'purchase_info';
    purchaseInfo.textContent = `Item Name: ${item_purchase.market_hash_name} | Buy Price: $${item_purchase.amount}`;

    // infos.find(a => a.)
    let sellItem = itemlist.find(item => item.asset_id == item_purchase.asset_id && item.type == "credit");
    const sellInfo = document.createElement('span');
    sellInfo.className = 'sell_info';
    let profit;
    if (sellItem != undefined) {
        // itemlist = itemlist.filter(a => a.sale_id != sellItem.sale_id)
        let sellCurrency;
        if (sellItem.currency == "EUR")
            sellCurrency = "€";
        else if (sellItem.currency == "USD")
            sellCurrency = "$";
        else 
            sellCurrency = sellItem.currency;

        const sellPrice = sellItem.amount; // Example calculation for sell price
        profit = clampPrice(sellPrice - sellItem.fee - item_purchase.amount);
        console.log(sellPrice, sellItem.fee, item_purchase.amount, profit);
        // sellInfo.textContent = `Sell Price: $${sellPrice} | Profit: $${profit}`;
        sellInfo.textContent = `Sell Price: ${sellCurrency}${sellPrice} | Fee ${sellCurrency}${sellItem.fee} | Profit: ${sellCurrency}${profit}`;
        if (profit > 0) {
            li.className = "purchase profitable"    
        } else {
            li.className = "purchase not_profitable"    
        }
    } else {
        sellInfo.textContent = `Sell Price: Not sold! | Profit: None`;
        li.className = "purchase not_sold"    
    }

    li.appendChild(purchaseInfo);
    li.appendChild(sellInfo);
    li.setAttribute("data-buyprice", item_purchase.amount);
    li.setAttribute("data-index", index);
    li.setAttribute("data-profit", profit);

    return li;
    // purchase[0].
}
function sum(list) {
    let _sum = 0;
    for (let item of list)
        _sum += item;
    return _sum;
}

window.onload = async () => {
    // calculate the total stats
    const itemsBought = itemlist.filter(a => a.type == "purchase");
    const itemsSold = itemlist.filter(a => a.type == "credit");
    const moneyBought = clampPrice(sum(itemsBought.map(a => a.amount)));
    const moneySold = clampPrice(sum(itemsSold.map(a => a.amount)));
    const moneySoldAfterFee = clampPrice(sum(itemsSold.map(a => a.amount - a.fee)));
    const profitAfterFee = moneySoldAfterFee - moneyBought;

    document.getElementById("items_bought").innerText = `Items bought: ${itemsBought.length}`;
    document.getElementById("items_sold").innerText = `Items sold: ${itemsSold.length}`;
    document.getElementById("money_bought").innerText = `Money spent: ${moneyBought}`;
    document.getElementById("money_sold").innerText = `Money sold: ${moneySold}`;
    document.getElementById("money_sold_after_fee").innerText = `Money sold after fees: ${moneySoldAfterFee}`;
    document.getElementById("profit_after_fee").innerText = `Profit after fees: ${profitAfterFee}`;

    console.log(itemlist)
    for (let index = 0; index < itemlist.length; index++) {
        let item = itemlist[index];
        if (item.type != "purchase") 
            continue;
        let dom_element = getDOMElementPurchase(item, index);
        if (dom_element == undefined) {
            console.log(item)
            continue;
        }
        document.getElementById("purchase_list").appendChild(dom_element)
    }

    

    console.log("a")
    let item_amount_info = JSON.parse(window.localStorage.getItem("amount_info"));
    let timeDiff = new Date().getTime() - item_amount_info.fetchTime;
    if (timeDiff/1000 > 12*60*60) {
        document.getElementById("warning").style.display = "block"; 
    }
    console.log(timeDiff)
}

// TODO: add filters to view the total stats, like ignore not sold