import { ReactNode } from "react";

// Dashboard Sidebar
export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// HeroSectionProps Dot AnimatedDots
export interface Dot {
  id: number;
  x: number;
  y: number;
}

// HeroSectionProps HeroSection
export interface HeroSectionProps {
  smallText?: string;
  title: string;
  description?: string;
  image?: {
    src: string;
    alt: string;
  };
  backgroundColor?: string;
  buttons?: React.ReactNode;
  stats?: Array<{
    number: string;
    label: string;
    endValue: number;
  }>;
  className?: string;
  variant?: "home" | "page";
}
// custom button component
export interface CustomButtonProps {
  primaryText: string;
  secondaryText: string;
  icon?: React.ReactNode;
  href?: string;
  className?: string;
  variant?: "filled" | "outlined";
  bgColor?: string;
  textColor?: string;
  hoverBgColor?: string;
  hoverTextColor?: string;
}

//  MobileMenu
export interface MobileMenuProps {
  menuItems: { name: string; href: string }[];
  onClose: () => void;
}

//  course cards component
export interface Course {
  id: string;
  title: string;
  category: "DEVELOPMENT" | "DESIGN" | "CLOUD";
  instructor: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  lessons: number;
  students: number;
  slug?: string;
}

export type Category = "All" | "DEVELOPMENT" | "DESIGN" | "CLOUD";

export interface CourseListingProps {
  defaultCategory?: Category;
  limit?: number;
}

//  accordion item component
export interface AccordionItemProps {
  title: string;
  content: string;
  icon: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

export interface AccordionProps {
  items: {
    id: string;
    title: string;
    content: string;
    icon: ReactNode;
  }[];
  defaultOpenId?: string;
}

//  testimonial component
export interface Testimonial {
  id: number;
  name: string;
  role: string;
  image: string;
  content: string;
  rating: number;
  videoUrl: string;
}

export interface CompanyLogo {
  name: string;
  image: string;
}

// infinite text scroll component
export interface InfiniteTextScrollProps {
  text: string;
  content: string;
  speed?: number;
}

// Animated Text
export interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
}

// instructor section component
export interface InstructorData {
  id: number;
  name: string;
  role: string;
  image: string;
  socials: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    dribbble?: string;
    linkedin?: string;
    github?: string;
  };
}

// course Card component
export interface CourseCardProps {
  course: Course;
  formatPrice: (price: number) => string;
}

// video modal component
export interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  content: string;
}

// Course session 
export interface CourseContent {
  title: string;
  isLocked: boolean;
  isCompleted: boolean;
}