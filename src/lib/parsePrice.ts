export const parsePrice = (priceStr: string | undefined): number | null => {
  if (!priceStr) return null;
  const match = priceStr.match(/[\d,.]+/);
  if (!match) return null;
  const price = Number.parseFloat(match[0].replace(",", ""));
  return !Number.isNaN(price) && price > 0 ? price : null;
};
