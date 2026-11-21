/**
 * Data model of REWEAR: one interface per collection of db.json
 * (users, listings, reviews, favourites, messages, contactMessages).
 */

export type Category = 'Women' | 'Men' | 'Kids' | 'Vintage' | 'Streetwear';
export type Condition = 'Like New' | 'Excellent' | 'Good' | 'Fair';
export type Badge = 'Basic' | 'Verified' | 'Trusted';
export type ListingStatus = 'active' | 'sold' | 'draft';

/** A member: buyer and seller at the same time (collection users). */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Simulated authentication only: never store plain passwords in a real application. */
  password: string;
  city: string;
  badge: Badge;
  memberSince: string;
}

/** User data kept in the browser after log-in (no password). */
export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  badge: Badge;
  memberSince: string;
}

/** An item for sale (collection listings). Photos are image paths or data URLs. */
export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: Category;
  type: string;
  size: string;
  brand: string;
  color: string;
  condition: Condition;
  price: number;
  photos: string[];
  status: ListingStatus;
  createdAt: string;
  views: number;
}

/** A buyer's mark (1 to 5) and comment about a seller (collection reviews). */
export interface Review {
  id: string;
  sellerId: string;
  authorName: string;
  rating: number;
  comment: string;
  date: string;
}

/** A heart: one user saved one listing (collection favourites). */
export interface Favourite {
  id: string;
  userId: string;
  listingId: string;
}

/** A message sent from a product page to the seller (collection messages). */
export interface Message {
  id: string;
  listingId: string;
  sellerId: string;
  fromUserId: string;
  text: string;
  date: string;
}

export type ContactSubject =
  'Question about an item' | 'My account' | 'Report a problem' | 'Partnership' | 'Other';

/** Message sent to the REWEAR team from the Contact form (stored in db.json › contactMessages). */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: ContactSubject;
  text: string;
  /** Id of the logged-in member, or null for a visitor. */
  userId: string | null;
  date: string;
}

export const CONTACT_SUBJECTS: ContactSubject[] = [
  'Question about an item',
  'My account',
  'Report a problem',
  'Partnership',
  'Other',
];

/** Lists used by the menus, filters and forms. */
export const CATEGORIES: Category[] = ['Women', 'Men', 'Kids', 'Vintage', 'Streetwear'];
export const CONDITIONS: Condition[] = ['Like New', 'Excellent', 'Good', 'Fair'];
export const BADGES: Badge[] = ['Basic', 'Verified', 'Trusted'];

export const TYPES: string[] = [
  'T-shirts',
  'Shirts',
  'Tops',
  'Hoodies',
  'Jackets',
  'Coats',
  'Jeans',
  'Trousers',
  'Dresses',
  'Skirts',
  'Shoes',
  'Accessories',
];

/** Size order used by the size selector and the shop filters. */
export const SIZES: string[] = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '2 years',
  '4 years',
  '6 years',
  '8 years',
  '10 years',
  '12 years',
];

/** Explanations shown next to each condition in the Sell form and the guide. */
export const CONDITION_INFO: Record<Condition, string> = {
  'Like New': 'Never or barely worn, no signs of use.',
  Excellent: 'Very good condition, light signs of use.',
  Good: 'Visible wear, but no defects.',
  Fair: 'Acceptable, clear signs of wear.',
};

/** Explanations of the seller badges (tooltips and "How it works"). */
export const BADGE_INFO: Record<Badge, string> = {
  Basic: 'New seller with a confirmed email address.',
  Verified: 'Phone number and identity checked by the REWEAR team (simulated).',
  Trusted: 'Verified seller with many sales and an excellent rating.',
};

/** Short random identifier for new records. */
export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Converts a full user (with password) to the data we keep in the browser. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    city: user.city,
    badge: user.badge,
    memberSince: user.memberSince,
  };
}
