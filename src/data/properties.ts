import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";
import property5 from "@/assets/property-5.jpg";
import property6 from "@/assets/property-6.jpg";

export interface Seller {
  name: string;
  initials: string;
  rating: number;
  transactions: number;
  verified: boolean;
}

export interface Property {
  id: number | string;
  image: string;
  title: string;
  location: string;
  priceNGN: string;
  priceUSD: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  type: string;
  seller: Seller;
  sellerId?: string; // user_id of the property owner (for DB properties)
  description?: string;
  features?: string[];
}

export const PROPERTIES: Property[] = [
  {
    id: 1, image: property1, title: "3-Bedroom Modern House", location: "Lekki, Lagos",
    priceNGN: "200,000,000", priceUSD: "2,500,000", bedrooms: 3, bathrooms: 3, sqft: 2400, type: "House",
    seller: { name: "John Doe", initials: "JD", rating: 5, transactions: 30, verified: true },
    description: "A stunning 3-bedroom modern house in the heart of Lekki. Features contemporary architecture, open-plan living, fully fitted kitchen, and a private garden. Located in a secure estate with 24/7 security.",
    features: ["Smart home system", "Solar panels", "CCTV security", "Private garden", "En-suite bathrooms", "Walk-in closets", "Fitted kitchen", "Parking for 3 cars"],
  },
  {
    id: 2, image: property2, title: "Luxury 2-Bed Apartment", location: "Victoria Island, Lagos",
    priceNGN: "85,000,000", priceUSD: "1,060,000", bedrooms: 2, bathrooms: 2, sqft: 1200, type: "Apartment",
    seller: { name: "Amina B.", initials: "AB", rating: 4, transactions: 18, verified: true },
    description: "Premium 2-bedroom apartment on Victoria Island with panoramic city views. Features floor-to-ceiling windows, modern interiors, gym access, and a rooftop pool.",
    features: ["City views", "Gym access", "Rooftop pool", "Concierge service", "Underground parking", "Balcony"],
  },
  {
    id: 3, image: property3, title: "5-Bedroom Villa with Pool", location: "Ikoyi, Lagos",
    priceNGN: "450,000,000", priceUSD: "5,625,000", bedrooms: 5, bathrooms: 4, sqft: 4800, type: "Villa",
    seller: { name: "Emeka O.", initials: "EO", rating: 5, transactions: 42, verified: true },
    description: "Exquisite 5-bedroom villa in the prestigious Ikoyi neighborhood. Boasts a private swimming pool, manicured gardens, cinema room, and staff quarters.",
    features: ["Private pool", "Cinema room", "Staff quarters", "Manicured gardens", "Smart home", "Wine cellar", "Home office", "Double garage"],
  },
  {
    id: 4, image: property4, title: "3-Bedroom Townhouse", location: "Abuja, FCT",
    priceNGN: "120,000,000", priceUSD: "1,500,000", bedrooms: 3, bathrooms: 2, sqft: 1800, type: "Townhouse",
    seller: { name: "Sarah K.", initials: "SK", rating: 4, transactions: 12, verified: true },
    description: "A beautifully designed 3-bedroom townhouse in a serene Abuja neighborhood. Features a modern kitchen, private terrace, and community facilities.",
    features: ["Community pool", "Children's playground", "Private terrace", "Fitted kitchen", "Guest toilet", "Laundry room"],
  },
  {
    id: 5, image: property5, title: "Penthouse Suite", location: "Eko Atlantic, Lagos",
    priceNGN: "600,000,000", priceUSD: "7,500,000", bedrooms: 4, bathrooms: 3, sqft: 3500, type: "Apartment",
    seller: { name: "David L.", initials: "DL", rating: 5, transactions: 55, verified: true },
    description: "Ultra-luxury penthouse at Eko Atlantic with 360° ocean and city views. Features private elevator, chef's kitchen, and a wraparound terrace.",
    features: ["360° views", "Private elevator", "Chef's kitchen", "Wraparound terrace", "Wine room", "Smart home", "Jacuzzi", "Dedicated parking"],
  },
  {
    id: 6, image: property6, title: "Cozy 2-Bedroom Bungalow", location: "Ibadan, Oyo",
    priceNGN: "35,000,000", priceUSD: "437,500", bedrooms: 2, bathrooms: 1, sqft: 1000, type: "House",
    seller: { name: "Grace A.", initials: "GA", rating: 4, transactions: 8, verified: false },
    description: "A charming 2-bedroom bungalow in a quiet Ibadan neighborhood. Perfect for small families or as a rental investment property.",
    features: ["Spacious compound", "Borehole water", "Prepaid meter", "Tiled floors", "Security fence"],
  },
  {
    id: 7, image: property3, title: "Prime Residential Land", location: "Lekki, Lagos",
    priceNGN: "150,000,000", priceUSD: "1,875,000", bedrooms: 0, bathrooms: 0, sqft: 5000, type: "Land",
    seller: { name: "Kunle M.", initials: "KM", rating: 5, transactions: 25, verified: true },
    description: "Prime residential land in a fast-developing area of Lekki. Fully fenced with valid C of O. Ideal for residential development or investment.",
    features: ["Certificate of Occupancy", "Fully fenced", "Survey plan", "Gazette approved", "Road access", "Near commercial hub"],
  },
  {
    id: 8, image: property1, title: "Commercial Plot", location: "Abuja, FCT",
    priceNGN: "300,000,000", priceUSD: "3,750,000", bedrooms: 0, bathrooms: 0, sqft: 10000, type: "Land",
    seller: { name: "Tunde F.", initials: "TF", rating: 4, transactions: 15, verified: true },
    description: "Strategically located commercial plot in Abuja's central business district. Perfect for office buildings, retail, or mixed-use development.",
    features: ["C of O", "Corner piece", "Tarred road access", "Near government buildings", "High traffic area", "Flat terrain"],
  },
  {
    id: 9, image: property4, title: "Luxury Boutique Hotel", location: "Victoria Island, Lagos",
    priceNGN: "800,000,000", priceUSD: "10,000,000", bedrooms: 20, bathrooms: 20, sqft: 15000, type: "Hotel",
    seller: { name: "Ola R.", initials: "OR", rating: 5, transactions: 60, verified: true },
    description: "A fully operational luxury boutique hotel on Victoria Island with 20 rooms, a fine-dining restaurant, rooftop bar, and conference facilities.",
    features: ["20 rooms", "Fine-dining restaurant", "Rooftop bar", "Conference hall", "Spa & wellness", "Valet parking", "Backup power", "Swimming pool"],
  },
  {
    id: 10, image: property5, title: "Beachfront Resort Hotel", location: "Lekki, Lagos",
    priceNGN: "1,200,000,000", priceUSD: "15,000,000", bedrooms: 50, bathrooms: 50, sqft: 30000, type: "Hotel",
    seller: { name: "Bisi N.", initials: "BN", rating: 5, transactions: 38, verified: true },
    description: "A world-class beachfront resort in Lekki with 50 rooms, private beach access, multiple restaurants, infinity pool, and full event facilities.",
    features: ["50 rooms", "Private beach", "Infinity pool", "Multiple restaurants", "Event centre", "Helipad", "Water sports", "Kids club"],
  },
];
