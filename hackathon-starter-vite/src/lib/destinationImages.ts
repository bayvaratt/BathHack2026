// Maps IATA codes to Unsplash image URLs
export const destinationImages: Record<string, string> = {
  MAD: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80",
  BCN: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80",
  LIS: "https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=600&q=80",
  CDG: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80",
  AMS: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&q=80",
  FCO: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80",
  ATH: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&q=80",
  JFK: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
  DXB: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
  BKK: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=80",
  NRT: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
  SIN: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80",
  SYD: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&q=80",
  PVG: "https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?w=600&q=80",
};

export const getDestinationImage = (iata: string) =>
  destinationImages[iata] ??
  "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600&q=80";
