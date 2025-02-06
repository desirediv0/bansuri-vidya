import { Testimonial, CompanyLogo } from "@/type";

export const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Charlotte Smith",
    role: "Business owner",
    image: "/test-m-1.webp",
    content:
      "Course materials were good, the mentoring approach was good and working with other people via the internet was good.",
    rating: 5,
    videoUrl: "https://www.youtube.com/shorts/v_AO4pzwu70"
  },
  {
    id: 2,
    name: "David Chen",
    role: "Marketing Director",
    image: "/test-m-2.webp",
    content:
      "The structured learning approach and practical assignments helped me grasp complex concepts easily.",
    rating: 5,
    videoUrl: "https://www.youtube.com/shorts/z6mKzWBVWzE"
  },
  {
    id: 3,
    name: "Sarah Johnson",
    role: "Product Designer",
    image: "/test-m-3.webp",
    content:
      "Excellent platform for skill development. The community support is outstanding.",
    rating: 5,
    videoUrl: "https://www.youtube.com/shorts/-756Fa-NwfU"
  },
];

export const companyLogos: CompanyLogo[] = [
  {
    name: "Walmart",
    image: "/logo/walmart.png",
  },
  {
    name: "Google",
    image: "/logo/google.png",
  },
  {
    name: "Microsoft",
    image: "/logo/microsoft.png",
  },
  {
    name: "Yahoo",
    image: "/logo/yahoo.png",
  },
  {
    name: "Logitech",
    image: "/logo/logitech.png",
  },
];
