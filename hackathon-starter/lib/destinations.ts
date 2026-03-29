export const ORIGINS = [
  { code: 'EDI', city: 'Edinburgh', country: 'UK' },
  { code: 'LHR', city: 'London Heathrow', country: 'UK' },
  { code: 'MAN', city: 'Manchester', country: 'UK' },
] as const

export const DESTINATIONS = [
  // Europe
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands', region: 'Europe' },
  { code: 'ATH', city: 'Athens', country: 'Greece', region: 'Europe' },
  { code: 'BCN', city: 'Barcelona', country: 'Spain', region: 'Europe' },
  { code: 'CDG', city: 'Paris', country: 'France', region: 'Europe' },
  { code: 'FCO', city: 'Rome', country: 'Italy', region: 'Europe' },
  { code: 'LIS', city: 'Lisbon', country: 'Portugal', region: 'Europe' },
  { code: 'MAD', city: 'Madrid', country: 'Spain', region: 'Europe' },
  // Asia
  { code: 'BKK', city: 'Bangkok', country: 'Thailand', region: 'Asia' },
  { code: 'DXB', city: 'Dubai', country: 'UAE', region: 'Asia' },
  { code: 'NRT', city: 'Tokyo', country: 'Japan', region: 'Asia' },
  { code: 'PVG', city: 'Shanghai', country: 'China', region: 'Asia' },
  { code: 'SIN', city: 'Singapore', country: 'Singapore', region: 'Asia' },
  { code: 'SYD', city: 'Sydney', country: 'Australia', region: 'Asia' },
  // Americas
  { code: 'JFK', city: 'New York', country: 'USA', region: 'Americas' },
] as const
