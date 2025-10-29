function getItemPrice(item) {
  // Gère différents formats de prix: string, number, ou objet
  if (!item.price) return null;
  
  // Si c'est un objet, chercher dans les champs possibles
  if (typeof item.price === 'object') {
    return parseFloat(item.price.amount || item.price.value || 0);
  }
  
  // Si c'est une string ou number, convertir directement
  return parseFloat(item.price);
}

function formatPrice(item) {
  const price = getItemPrice(item);
  if (price === null || isNaN(price)) return null;
  
  const currency = item.currency || (typeof item.price === 'object' ? item.price.currency : null) || 'EUR';
  return `${price.toFixed(2)} ${currency}`;
}

module.exports = { getItemPrice, formatPrice };
