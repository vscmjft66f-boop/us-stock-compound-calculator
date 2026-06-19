(function () {
  "use strict";

  var utils = window.CalculatorUtils;
  var form = document.getElementById("compound-calculator-form");
  if (!form || !utils) return;

  function valueOf(id) {
    return utils.safeNumber(document.getElementById(id).value, 0);
  }

  function calculateMonthly(initial, monthly, annualRate, months) {
    if (annualRate <= -1) return null;
    var monthlyRate = annualRate / 12;
    var balance = initial;
    var rows = [];

    for (var month = 1; month <= months; month += 1) {
      balance = balance * (1 + monthlyRate) + monthly;
      if (month % 12 === 0 || month === months) {
        rows.push({
          year: month / 12,
          principal: initial + monthly * month,
          balance: balance
        });
      }
    }
    return { balance: balance, rows: rows };
  }

  function calculateAnnual(initial, monthly, annualRate, years) {
    if (annualRate <= -1) return null;
    var balance = initial;
    var yearlyContribution = monthly * 12;
    var rows = [];

    for (var year = 1; year <= years; year += 1) {
      balance = balance * (1 + annualRate) + yearlyContribution;
      rows.push({
        year: year,
        principal: initial + yearlyContribution * year,
        balance: balance
      });
    }
    return { balance: balance, rows: rows };
  }

  function renderRows(rows, currency) {
    var body = document.getElementById("compound-yearly-body");
    var fragment = document.createDocumentFragment();

    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      var yearCell = document.createElement("th");
      var principalCell = document.createElement("td");
      var balanceCell = document.createElement("td");
      var profitCell = document.createElement("td");

      yearCell.textContent = Number.isInteger(row.year) ? row.year + "년" : row.year.toFixed(1) + "년";
      principalCell.textContent = utils.formatCurrency(row.principal, 0, currency);
      balanceCell.textContent = utils.formatCurrency(row.balance, 0, currency);
      profitCell.textContent = utils.formatCurrency(row.balance - row.principal, 0, currency);

      tr.appendChild(yearCell);
      tr.appendChild(principalCell);
      tr.appendChild(balanceCell);
      tr.appendChild(profitCell);
      fragment.appendChild(tr);
    });

    body.replaceChildren(fragment);
  }

  function setMetric(id, value) {
    document.getElementById(id).textContent = value;
  }

  function updateCurrencyLabels(currency) {
    document.querySelectorAll("[data-compound-currency]").forEach(function (label) {
      label.textContent = currency;
    });
  }

  function updateCalculator() {
    var initial = valueOf("compound-initial");
    var monthly = valueOf("compound-monthly");
    var annualRate = valueOf("compound-rate") / 100;
    var years = Math.max(0, Math.floor(valueOf("compound-years")));
    var method = document.getElementById("compound-method").value;
    var currency = document.getElementById("compound-currency").value === "KRW" ? "KRW" : "USD";
    var valid = initial >= 0 && monthly >= 0 && years > 0 && annualRate > -1;

    updateCurrencyLabels(currency);

    if (!valid) {
      setMetric("compound-principal-result", "—");
      setMetric("compound-future-result", "—");
      setMetric("compound-profit-result", "—");
      renderRows([], currency);
      document.getElementById("compound-status").textContent = "입력값을 확인해 주세요.";
      return;
    }

    var calculation = method === "annual"
      ? calculateAnnual(initial, monthly, annualRate, years)
      : calculateMonthly(initial, monthly, annualRate, years * 12);
    var totalPrincipal = initial + monthly * 12 * years;
    var futureValue = calculation.balance;

    setMetric("compound-principal-result", utils.formatCurrency(totalPrincipal, 0, currency));
    setMetric("compound-future-result", utils.formatCurrency(futureValue, 0, currency));
    setMetric("compound-profit-result", utils.formatCurrency(futureValue - totalPrincipal, 0, currency));
    renderRows(calculation.rows, currency);
    document.getElementById("compound-status").textContent = "입력한 가정 기준으로 복리 계산 결과를 업데이트했습니다.";
  }

  form.addEventListener("input", updateCalculator);
  form.addEventListener("change", updateCalculator);
  updateCalculator();
})();
