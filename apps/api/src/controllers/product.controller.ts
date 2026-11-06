import { Request, Response } from "express";
import { prisma, Prisma } from "@repo/db";
import { StripeProductType } from "@repo/types";
import { createStripeProduct, deleteStripeProduct } from "../utils/stripeProduct.js";

const parseProductId = (
  id: string | undefined,
  res: Response
): number | null => {
  const productId = Number(id);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    res.status(400).json({ message: "Invalid product ID." });
    return null;
  }

  return productId;
};

export const createProduct = async (req: Request, res: Response) => {
  const data: Prisma.ProductCreateInput = req.body;

  const { colors, images } = data;
  if (!colors || !Array.isArray(colors) || colors.length === 0) {
    return res.status(400).json({ message: "Colors array is required!" });
  }

  if (!images || typeof images !== "object") {
    return res.status(400).json({ message: "Images object is required!" });
  }

  const missingColors = colors.filter((color) => !(color in (images as object)));

  if (missingColors.length > 0) {
    return res
      .status(400)
      .json({ message: "Missing images for colors!", missingColors });
  }

  const product = await prisma.product.create({ data });

  const stripeProduct: StripeProductType = {
    id: product.id.toString(),
    name: product.name,
    price: product.price,
  };

  // Directly create Stripe product in background
  createStripeProduct(stripeProduct).catch((err) =>
    console.log("Stripe product sync error:", err)
  );

  return res.status(201).json(product);
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const productId = parseProductId(id, res);
  if (productId === null) return;

  const data: Prisma.ProductUpdateInput = req.body;

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data,
  });

  return res.status(200).json(updatedProduct);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const productId = parseProductId(id, res);
  if (productId === null) return;

  const deletedProduct = await prisma.product.delete({
    where: { id: productId },
  });

  // Directly delete Stripe product in background
  deleteStripeProduct(productId).catch((err) =>
    console.log("Stripe product deletion sync error:", err)
  );

  return res.status(200).json(deletedProduct);
};

export const getProducts = async (req: Request, res: Response) => {
  const { sort, category, search, limit } = req.query;

  const orderBy = (() => {
    switch (sort) {
      case "asc":
        return { price: Prisma.SortOrder.asc };
      case "desc":
        return { price: Prisma.SortOrder.desc };
      case "oldest":
        return { createdAt: Prisma.SortOrder.asc };
      default:
        return { createdAt: Prisma.SortOrder.desc };
    }
  })();

  const products = await prisma.product.findMany({
    where: {
      category: category
        ? {
            slug: category as string,
          }
        : undefined,
      name: search
        ? {
            contains: search as string,
            mode: "insensitive",
          }
        : undefined,
    },
    orderBy,
    take: limit ? Number(limit) : undefined,
  });

  return res.status(200).json(products);
};

export const getProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const productId = parseProductId(id, res);
  if (productId === null) return;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  return res.status(200).json(product);
};
