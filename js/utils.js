(function () {
  "use strict";

  function safeNumber(value, fallback) {
    var normalized = typeof value === "string" ? value.replace(/,/g, "").trim() : value;
    var parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : (fallback === undefined ? 0 : fallback);
  }

  function formatCurrency(value, fractionDigits, currency) {
    if (!Number.isFinite(value)) return "—";
    var selectedCurrency = currency === "KRW" ? "KRW" : "USD";
    var digits = fractionDigits === undefined ? 0 : fractionDigits;
    return new Intl.NumberFormat(selectedCurrency === "KRW" ? "ko-KR" : "en-US", {
      style: "currency",
      currency: selectedCurrency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(value);
  }

  function formatPercent(value) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("ko-KR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      signDisplay: "auto"
    }).format(value) + "%";
  }

  function calculateCAGR(startValue, endValue, years) {
    if (!Number.isFinite(startValue) || !Number.isFinite(endValue) || !Number.isFinite(years)) return null;
    if (startValue <= 0 || endValue < 0 || years <= 0) return null;
    return Math.pow(endValue / startValue, 1 / years) - 1;
  }

  function calculateFutureValue(principal, annualRate, years) {
    if (![principal, annualRate, years].every(Number.isFinite)) return null;
    if (principal < 0 || annualRate <= -1 || years < 0) return null;
    return principal * Math.pow(1 + annualRate, years);
  }

  function calculateMonthlyContributionFutureValue(monthlyContribution, annualRate, years) {
    if (![monthlyContribution, annualRate, years].every(Number.isFinite)) return null;
    if (monthlyContribution < 0 || annualRate <= -1 || years < 0) return null;

    var months = Math.max(0, Math.round(years * 12));
    if (months === 0 || monthlyContribution === 0) return 0;

    var monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    if (Math.abs(monthlyRate) < 1e-12) return monthlyContribution * months;
    return monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  }

  window.CalculatorUtils = {
    formatCurrency: formatCurrency,
    formatPercent: formatPercent,
    safeNumber: safeNumber,
    calculateCAGR: calculateCAGR,
    calculateFutureValue: calculateFutureValue,
    calculateMonthlyContributionFutureValue: calculateMonthlyContributionFutureValue
  };
})();
