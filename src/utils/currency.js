export const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', label: 'USD - $' },
  { code: 'EUR', symbol: '€', label: 'EUR - €' },
  { code: 'GBP', symbol: '£', label: 'GBP - £' },
  { code: 'ILS', symbol: '₪', label: 'ILS - ₪' },
  { code: 'AED', symbol: 'AED', label: 'AED - AED' },
];

const currencySymbolMap = CURRENCY_OPTIONS.reduce((currencyMap, currency) => {
  currencyMap[currency.code] = currency.symbol;
  currencyMap[currency.symbol] = currency.symbol;
  return currencyMap;
}, {});

export function getCurrencySymbol(currency = 'USD') {
  return currencySymbolMap[currency] || '$';
}

export function normalizeCurrencyCode(currency = 'USD') {
  const matchingOption = CURRENCY_OPTIONS.find(
    (option) => option.code === currency || option.symbol === currency,
  );

  return matchingOption?.code || 'USD';
}

export function formatPrice(amount, currency = 'USD') {
  const currencyCode = normalizeCurrencyCode(currency);

  if (currencyCode === 'AED') {
    return `AED ${amount}`;
  }

  return `${getCurrencySymbol(currencyCode)}${amount}`;
}
