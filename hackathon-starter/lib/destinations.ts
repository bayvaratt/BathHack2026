export const ORIGINS = [
  { code: 'LHR', city: 'London Heathrow', country: 'UK' },
  { code: 'BRS', city: 'Bristol', country: 'UK' },
] as const

export const DESTINATIONS = [
  // Europe
  { code: 'CDG', city: 'Paris', country: 'France', region: 'Europe' },
  { code: 'BCN', city: 'Barcelona', country: 'Spain', region: 'Europe' },
  { code: 'MAD', city: 'Madrid', country: 'Spain', region: 'Europe' },
  { code: 'FCO', city: 'Rome', country: 'Italy', region: 'Europe' },
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands', region: 'Europe' },
  { code: 'LIS', city: 'Lisbon', country: 'Portugal', region: 'Europe' },
  { code: 'ATH', city: 'Athens', country: 'Greece', region: 'Europe' },
  { code: 'PRG', city: 'Prague', country: 'Czech Republic', region: 'Europe' },
  { code: 'VIE', city: 'Vienna', country: 'Austria', region: 'Europe' },
  { code: 'IST', city: 'Istanbul', country: 'Turkey', region: 'Europe' },
  // Asia
  { code: 'DXB', city: 'Dubai', country: 'UAE', region: 'Asia' },
  { code: 'BKK', city: 'Bangkok', country: 'Thailand', region: 'Asia' },
  { code: 'HKT', city: 'Phuket', country: 'Thailand', region: 'Asia' },
  { code: 'DPS', city: 'Bali', country: 'Indonesia', region: 'Asia' },
  { code: 'SIN', city: 'Singapore', country: 'Singapore', region: 'Asia' },
  { code: 'NRT', city: 'Tokyo', country: 'Japan', region: 'Asia' },
  { code: 'HKG', city: 'Hong Kong', country: 'Hong Kong', region: 'Asia' },
  { code: 'MLE', city: 'Maldives', country: 'Maldives', region: 'Asia' },
  { code: 'CMB', city: 'Colombo', country: 'Sri Lanka', region: 'Asia' },
  // Americas
  { code: 'JFK', city: 'New York', country: 'USA', region: 'Americas' },
  { code: 'LAX', city: 'Los Angeles', country: 'USA', region: 'Americas' },
  { code: 'MIA', city: 'Miami', country: 'USA', region: 'Americas' },
  { code: 'CUN', city: 'Cancun', country: 'Mexico', region: 'Americas' },
  { code: 'GRU', city: 'São Paulo', country: 'Brazil', region: 'Americas' },
  { code: 'YYZ', city: 'Toronto', country: 'Canada', region: 'Americas' },
] as const
