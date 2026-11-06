// Populates sample categories, products, and orders for local/dev testing.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Electronics", slug: "electronics" },
  { name: "Clothing", slug: "clothing" },
  { name: "Home & Garden", slug: "home-garden" },
  { name: "Books", slug: "books" },
  { name: "Sports", slug: "sports" },
];

const products = [
  {
    name: "Wireless Headphones",
    shortDescription: "Noise-cancelling over-ear headphones",
    description:
      "Premium wireless headphones with active noise cancellation, 30-hour battery life, and plush ear cushions for all-day comfort.",
    price: 12999,
    sizes: ["One Size"],
    colors: ["Black", "Silver"],
    images: {
      Black: ["/products/1g.png", "/products/1gg.png"],
      Silver: ["/products/1w.png", "/products/1ww.png"],
    },
    categorySlug: "electronics",
  },
  {
    name: "Smart Watch",
    shortDescription: "Fitness tracker with heart-rate monitor",
    description:
      "Track your workouts, sleep, and heart rate with this water-resistant smart watch featuring a 7-day battery life.",
    price: 19999,
    sizes: ["S/M", "L/XL"],
    colors: ["Black", "Rose Gold"],
    images: {
      Black: ["/products/2g.png", "/products/2gg.png"],
      "Rose Gold": ["/products/2w.png", "/products/2ww.png"],
    },
    categorySlug: "electronics",
  },
  {
    name: "Classic T-Shirt",
    shortDescription: "100% cotton crew neck tee",
    description:
      "A soft, breathable everyday t-shirt made from 100% combed cotton. Pre-shrunk and machine washable.",
    price: 2499,
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Black"],
    images: {
      White: ["/products/3g.png", "/products/3gg.png"],
      Black: ["/products/3w.png", "/products/3ww.png"],
    },
    categorySlug: "clothing",
  },
  {
    name: "Denim Jacket",
    shortDescription: "Classic fit denim jacket",
    description:
      "A timeless denim jacket with a classic fit, button front closure, and chest pockets.",
    price: 7999,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Blue"],
    images: {
      Blue: ["/products/4g.png", "/products/4gg.png"],
    },
    categorySlug: "clothing",
  },
  {
    name: "Ceramic Plant Pot",
    shortDescription: "Minimalist indoor plant pot",
    description:
      "A handcrafted ceramic plant pot with drainage hole, perfect for succulents and small houseplants.",
    price: 1899,
    sizes: ["Small", "Medium", "Large"],
    colors: ["Terracotta", "White"],
    images: {
      Terracotta: ["/products/1g.png"],
      White: ["/products/1w.png"],
    },
    categorySlug: "home-garden",
  },
  {
    name: "The Pragmatic Programmer",
    shortDescription: "Your journey to mastery",
    description:
      "A classic guide covering timeless techniques and philosophies for becoming a better software developer.",
    price: 3499,
    sizes: ["Paperback"],
    colors: ["Default"],
    images: {
      Default: ["/products/2g.png"],
    },
    categorySlug: "books",
  },
  {
    name: "Yoga Mat",
    shortDescription: "Non-slip eco-friendly yoga mat",
    description:
      "A 6mm thick, non-slip yoga mat made from eco-friendly TPE material, ideal for yoga, pilates, and floor workouts.",
    price: 3999,
    sizes: ["One Size"],
    colors: ["Purple", "Teal"],
    images: {
      Purple: ["/products/3g.png"],
      Teal: ["/products/3w.png"],
    },
    categorySlug: "sports",
  },
];

async function main() {
  console.log("Seeding categories...");
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log("Seeding products...");
  const createdProducts = [];
  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    });
    const record =
      existing ??
      (await prisma.product.create({
        data: product,
      }));
    createdProducts.push(record);
  }

  console.log("Seeding orders...");
  const sampleOrders = [
    {
      userId: "seed-user-1",
      email: "customer1@example.com",
      status: "success",
      products: [
        { id: createdProducts[0].id, name: createdProducts[0].name, quantity: 1, price: createdProducts[0].price },
        { id: createdProducts[2].id, name: createdProducts[2].name, quantity: 2, price: createdProducts[2].price },
      ],
    },
    {
      userId: "seed-user-2",
      email: "customer2@example.com",
      status: "pending",
      products: [
        { id: createdProducts[1].id, name: createdProducts[1].name, quantity: 1, price: createdProducts[1].price },
      ],
    },
    {
      userId: "seed-user-1",
      email: "customer1@example.com",
      status: "success",
      products: [
        { id: createdProducts[4].id, name: createdProducts[4].name, quantity: 3, price: createdProducts[4].price },
      ],
    },
  ];

  for (const order of sampleOrders) {
    const amount = order.products.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    await prisma.order.create({
      data: {
        userId: order.userId,
        email: order.email,
        amount,
        status: order.status,
        products: order.products,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
