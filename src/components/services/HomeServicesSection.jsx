"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Shield, Sparkles, Shirt, SquareDot, Box, DoorClosed, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { getPublicProducts } from "@/services/api";

const ICON_MAP = {
  "invisible-grills": Shield,
  "mosquito-mesh": Sparkles,
  "cloth-hangers": Shirt,
  "upvc-windows": SquareDot,
  "shoe-racks": Box,
  "security-screen-doors": DoorClosed,
};

const homeProducts = [
  {
    id: "invisible-grills",
    name: "Invisible Grills",
    description:
      "Safety with a clean, modern look. Enjoy uninterrupted views with maximum protection.",
    icon: Shield,
    image: "/images/highrise_view.jpg",
    highlight: "Flagship Product",
    href: "#product",
  },
  {
    id: "mosquito-mesh",
    name: "Mosquito Mesh",
    description:
      "Fresh air, fewer mosquitoes. Keep your home comfortable and insect-free.",
    icon: Sparkles,
    image: "/images/window_interior.jpg",
    highlight: "Healthy Living",
    href: "#enquiry",
  },
  {
    id: "cloth-hangers",
    name: "Cloth Hangers",
    description:
      "Smart and space-saving drying solutions for modern homes.",
    icon: Shirt,
    image: "/images/terrace_panoramic.jpg",
    highlight: "Space Saver",
    href: "#enquiry",
  },
  {
    id: "upvc-windows",
    name: "UPVC Windows",
    description:
      "Stylish, durable and low-maintenance windows for better comfort.",
    icon: SquareDot,
    image: "/images/type_sliding.jpg",
    highlight: "Weatherproof",
    href: "#window-types",
  },
  {
    id: "shoe-racks",
    name: "Shoe Racks",
    description:
      "Organized and space-saving storage solutions for your footwear.",
    icon: Box,
    image: "/images/modern_residence.jpg",
    highlight: "Smart Storage",
    href: "#enquiry",
  },
  {
    id: "security-screen-doors",
    name: "Security Screen Doors",
    description:
      "Protection with airflow and style. Keep your home secure without compromising ventilation.",
    icon: DoorClosed,
    image: "/images/type_casement.jpg",
    highlight: "High Protection",
    href: "#enquiry",
  },
];

export default function HomeServicesSection() {
  const [products, setProducts] = useState(homeProducts);

  useEffect(() => {
    let isMounted = true;
    getPublicProducts()
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item, index) => {
            const slug = item.slug || item.id || `product-${index}`;
            const Icon = ICON_MAP[slug] || Shield;
            let href = "#enquiry";
            if (slug === "invisible-grills") href = "#product";
            else if (slug === "upvc-windows") href = "#window-types";

            return {
              id: item._id || slug,
              name: item.name,
              description: item.shortDescription || item.description || "",
              icon: Icon,
              image: item.image || item.imageUrl || "/images/highrise_view.jpg",
              highlight: item.highlight || "Popular",
              href,
            };
          });
          setProducts(mapped);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch public products from API, using fallback data:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="products" className="py-20 sm:py-24 bg-deccan-dark relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
            OUR PRODUCTS &amp; SERVICES
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Complete Home Solutions
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mt-3 sm:mt-4 font-light leading-relaxed">
            From safety to style, we provide everything you need for modern living spaces.
          </p>
        </div>

        {/* 6 Product & Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {products.map((product, index) => {
            const Icon = product.icon;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group architectural-card flex flex-col rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-deccan-cyan/50 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Product Card Image */}
                <div className="relative aspect-[16/10] w-full bg-deccan-dark/80 overflow-hidden">
                  <Image
                    src={product.image || "/images/highrise_view.jpg"}
                    alt={`${product.name} by Deccan Space Works`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deccan-dark/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* Badge */}
                  <div className="absolute top-3 right-3 bg-deccan-dark/90 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-mono text-deccan-cyan font-medium">
                    {product.highlight}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Icon & Title */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-deccan-cyan/10 border border-deccan-cyan/25 flex items-center justify-center text-deccan-cyan group-hover:bg-deccan-cyan group-hover:text-deccan-dark transition-all duration-300">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-display text-xl font-bold text-white group-hover:text-deccan-cyan transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    <p className="text-slate-300 text-sm font-light leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Action Link */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <Link
                      href={product.href}
                      aria-label={`Learn more about ${product.name}`}
                      className="group/link inline-flex items-center gap-1.5 text-xs font-semibold text-deccan-cyan hover:text-cyan-300 transition-colors"
                    >
                      <span>Learn More</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    </Link>
                    <Link
                      href="#enquiry"
                      aria-label={`Book free site visit for ${product.name}`}
                      className="text-[11px] text-slate-400 hover:text-white font-mono transition-colors"
                    >
                      Book Visit →
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
