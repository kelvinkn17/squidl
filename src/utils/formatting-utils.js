export const shortenId = (id, prefixLength = 6, suffixLength = 4) => {
  try {
    const prefix = id.slice(0, prefixLength);
    const suffix = id.slice(id.length - suffixLength, id.length);

    return `${prefix}...${suffix}`;
  } catch (error) {
    console.log(error);
    return id;
  }
};

export const formatCurrency = (
  amount,
  currency,
  locale = "en-US",
  customSymbol
) => {
  if (["USD", "EUR", "GBP"].includes(currency)) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  } else {
    const symbol = customSymbol || currency;
    return `${amount.toFixed(4)} ${symbol}`;
  }
};
