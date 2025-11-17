/**
 * This is our "Fake ML Model" for the UI demo.
 * It generates a realistic-looking probability and price.
 */
export function getFakePrediction(lotId: string | number) {
  // Get the current hour (0-23)
  const currentHour = new Date().getHours();
  // Simple hash to make the ID affect the result
  const idHash = Number(String(lotId).slice(-2)) || 10

  let probability;

  // Logic: Empty in early morning, rush hour, busy day, quiet evening
  if (currentHour < 6) { // 12am - 6am
    probability = 10 + (idHash % 10);
  } else if (currentHour < 10) { // 6am - 10am (Morning Rush)
    probability = 60 + (idHash % 15);
  } else if (currentHour < 16) { // 10am - 4pm (Working Day)
    probability = 75 + (idHash % 20);
  } else if (currentHour < 20) { // 4pm - 8pm (Evening Rush)
    probability = 85 + (idHash % 10);
  } else { // 8pm - 12am
    probability = 40 + (idHash % 15);
  }
  
  probability = Math.min(probability, 98); // Cap at 98%

  // Fake Dynamic Price Logic
  const basePrice = 50; 
  let dynamicPrice = basePrice;
  if (probability > 80) dynamicPrice = basePrice * 2; // Surge
  else if (probability > 60) dynamicPrice = basePrice * 1.5;
  else if (probability < 20) dynamicPrice = basePrice * 0.8; // Discount

  return {
    probability: Math.round(probability),
    price_pkr: Math.round(dynamicPrice),
    probability_text: probability > 75 ? "Low Chance" : (probability > 40 ? "Good Chance" : "High Chance")
  };
}