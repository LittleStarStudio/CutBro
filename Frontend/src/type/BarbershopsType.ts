// File: src/types/barbershop.ts
// Create this file and use it across all components

export interface Barbershop {
  id: number;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  price: string;
  status: 'Open' | 'Full';
  image?: string;
  owner: string;
  revenue: number;
  bookings: number;
  joinDate: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export interface SearchAndFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filter: string) => void;
  searchPlaceholder: string;
}

export interface BarbershopTableProps {
  barbershops: Barbershop[];
  onBookNow: (id: number) => void;
}