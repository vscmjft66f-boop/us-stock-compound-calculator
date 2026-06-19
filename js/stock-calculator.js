(function () {
  "use strict";

  var utils = window.CalculatorUtils;
  var form = document.getElementById("stock-calculator-form");
  if (!form || !utils) return;

  var scenarioNames = ["bear", "base", "bull"];
  var scenarioLabels = {
    bear: "보수적",
    base: "기준",
    bull: "낙관적"
  };

  function getNumber(id) {
    var element = document.getElementById(id);
    return element ? utils.safeNumber(element.value, 0) : 0;
  }

  function getAssumptions() {
    return {
      ticker: (document.getElementById("ticker").value || "미입력 종목").trim().toUpperCase(),
      currentPrice: getNumber("current-price"),
      currentEPS: getNumber("current-eps"),
      years: getNumber("investment-years"),
      initialInvestment: getNumber("initial-investment"),
      monthlyContribution: getNumber("monthly-contribution"),
      investmentCurrency: document.getElementById("investment-currency").value === "KRW" ? "KRW" : "USD"
    };
  }

  function getScenario(name) {
    return {
      epsGrowth: getNumber(name + "-growth") / 100,
      futurePER: getNumber(name + "-per"),
      dividendYield: getNumber(name + "-dividend") / 100,
      buybackEffect: getNumber(name + "-buyback") / 100
    };
  }

  function calculateScenario(common, scenario) {
    var validCore = common.currentPrice > 0 && common.currentEPS >= 0 && common.years > 0 &&
      common.initialInvestment >= 0 && common.monthlyContribution >= 0;
    var combinedGrowth = scenario.epsGrowth + scenario.buybackEffect;
    var growthBase = 1 + combinedGrowth;
    var validScenario = scenario.futurePER >= 0 && growthBase >= 0 && scenario.dividendYield > -1;

    if (!validCore || !validScenario) return null;

    var futureEPS = common.currentEPS * Math.pow(growthBase, common.years);
    var futurePrice = futureEPS * scenario.futurePER;
    var priceCAGR = utils.calculateCAGR(common.currentPrice, futurePrice, common.years);
    if (priceCAGR === null) return null;

    var expectedAnnualReturn = priceCAGR + scenario.dividendYield;
    if (expectedAnnualReturn <= -1) return null;

    var initialFutureValue = utils.calculateFutureValue(
      common.initialInvestment,
      expectedAnnualReturn,
      common.years
    );
    var contributionsFutureValue = utils.calculateMonthlyContributionFutureValue(
      common.monthlyContribution,
      expectedAnnualReturn,
      common.years
    );
    var totalPrincipal = common.initialInvestment + common.monthlyContribution * 12 * common.years;
    var futureValue = initialFutureValue + contributionsFutureValue;

    return {
      futureEPS: futureEPS,
      futurePrice: futurePrice,
      upside: (futurePrice / common.currentPrice - 1) * 100,
      annualReturn: expectedAnnualReturn * 100,
      totalPrincipal: totalPrincipal,
      futureValue: futureValue,
      profit: futureValue - totalPrincipal
    };
  }

  function setResult(name, metric, value) {
    var cell = document.querySelector('[data-result="' + name + '-' + metric + '"]');
    if (cell) cell.textContent = value;
  }

  function updateResultColumn(name, result, investmentCurrency) {
    if (!result) {
      ["future-eps", "future-price", "upside", "annual-return", "principal", "future-value", "profit"].forEach(function (metric) {
        setResult(name, metric, "—");
      });
      return;
    }

    setResult(name, "future-eps", utils.formatCurrency(result.futureEPS, 2));
    setResult(name, "future-price", utils.formatCurrency(result.futurePrice, 2));
    setResult(name, "upside", utils.formatPercent(result.upside));
    setResult(name, "annual-return", utils.formatPercent(result.annualReturn));
    setResult(name, "principal", utils.formatCurrency(result.totalPrincipal, 0, investmentCurrency));
    setResult(name, "future-value", utils.formatCurrency(result.futureValue, 0, investmentCurrency));
    setResult(name, "profit", utils.formatCurrency(result.profit, 0, investmentCurrency));
  }

  function updateCurrencyLabels(currency) {
    document.querySelectorAll("[data-investment-currency]").forEach(function (label) {
      label.textContent = currency;
    });
  }

  function updateCurrentPER(common) {
    var perField = document.getElementById("current-per");
    if (!perField) return;
    perField.value = common.currentEPS > 0 && common.currentPrice >= 0
      ? (common.currentPrice / common.currentEPS).toFixed(1) + "배"
      : "계산 불가";
  }

  function updateInterpretation(common, baseScenario, baseResult) {
    var target = document.getElementById("base-interpretation");
    if (!target) return;

    if (!baseResult) {
      target.textContent = "현재 주가, EPS, 투자 기간과 기준 시나리오 값을 확인해 주세요. 유효한 값을 입력하면 해석이 여기에 표시됩니다.";
      return;
    }

    target.textContent = "입력한 가정 기준, " + common.ticker + "의 기준 시나리오에서는 EPS가 앞으로 " +
      common.years + "년 동안 매년 " + utils.formatPercent(baseScenario.epsGrowth * 100) +
      " 성장하고 자사주매입 효과가 연 " + utils.formatPercent(baseScenario.buybackEffect * 100) +
      " 더해지며, " + common.years + "년 뒤 시장이 이 회사를 PER " +
      baseScenario.futurePER.toFixed(1) + "배로 평가한다고 가정합니다. 이 경우 예상 연복리 수익률은 약 " +
      utils.formatPercent(baseResult.annualReturn) + "이며, 초기 투자금 " +
      utils.formatCurrency(common.initialInvestment, 0, common.investmentCurrency) + "와 매월 " +
      utils.formatCurrency(common.monthlyContribution, 0, common.investmentCurrency) +
      "를 투자하면 " + common.years + "년 뒤 시나리오 예상값은 약 " +
      utils.formatCurrency(baseResult.futureValue, 0, common.investmentCurrency) + "입니다.";
  }

  function createCell(tagName, text, className) {
    var cell = document.createElement(tagName);
    cell.textContent = text;
    if (className) cell.className = className;
    return cell;
  }

  function updateSensitivityTable(common, baseScenario) {
    var body = document.getElementById("sensitivity-body");
    if (!body) return;

    var growthRates = [0, 5, 10, 15, 20];
    var perValues = [10, 15, 20, 25, 30, 40];
    var fragment = document.createDocumentFragment();

    growthRates.forEach(function (growthRate) {
      var row = document.createElement("tr");
      row.appendChild(createCell("th", "EPS 성장률 " + growthRate + "%"));

      perValues.forEach(function (futurePER) {
        var scenario = {
          epsGrowth: growthRate / 100,
          futurePER: futurePER,
          dividendYield: baseScenario.dividendYield,
          buybackEffect: baseScenario.buybackEffect
        };
        var result = calculateScenario(common, scenario);
        var value = result ? result.annualReturn : null;
        var className = "";
        if (value !== null) {
          className = value < 0 ? "negative" : (value < 8 ? "moderate" : "positive");
        }
        row.appendChild(createCell("td", value === null ? "—" : utils.formatPercent(value), className));
      });

      fragment.appendChild(row);
    });

    body.replaceChildren(fragment);
  }

  function updateCalculator() {
    var common = getAssumptions();
    var results = {};
    var scenarios = {};

    updateCurrentPER(common);
    updateCurrencyLabels(common.investmentCurrency);

    scenarioNames.forEach(function (name) {
      scenarios[name] = getScenario(name);
      results[name] = calculateScenario(common, scenarios[name]);
      updateResultColumn(name, results[name], common.investmentCurrency);
    });

    updateInterpretation(common, scenarios.base, results.base);
    updateSensitivityTable(common, scenarios.base);

    var status = document.getElementById("calculation-status");
    if (status) {
      status.textContent = results.base
        ? "입력값을 반영해 교육용 계산 결과를 업데이트했습니다."
        : "일부 입력값으로 계산할 수 없습니다. 값을 확인해 주세요.";
    }
  }

  form.addEventListener("input", updateCalculator);
  form.addEventListener("change", updateCalculator);
  updateCalculator();
})();
