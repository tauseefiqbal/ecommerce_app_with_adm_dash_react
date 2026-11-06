import { Request, Response } from "express";
import { prisma } from "@repo/db";
import { OrderChartType } from "@repo/types";
import { startOfMonth, subMonths } from "date-fns";
import sendMail from "../utils/mailer.js";

// Helper to format order with _id alias for frontend compatibility
export const formatOrder = (order: any) => ({
  ...order,
  _id: order.id,
});

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(orders.map(formatOrder));
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch user orders!" });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;

    const orders = await prisma.order.findMany({
      take: limit ? Number(limit) : undefined,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(orders.map(formatOrder));
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch orders!" });
  }
};

export const getOrderChart = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
          lte: now,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const results: OrderChartType[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const year = d.getFullYear();
      const month = d.getMonth();

      const monthOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return (
          orderDate.getFullYear() === year && orderDate.getMonth() === month
        );
      });

      results.push({
        month: monthNames[month] as string,
        total: monthOrders.length,
        successful: monthOrders.filter((o) => o.status === "success").length,
      });
    }

    return res.status(200).json(results);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch order chart!" });
  }
};

export const createOrderInDatabase = async (data: {
  userId: string;
  email: string;
  amount: number;
  status: string;
  products: any[];
}) => {
  try {
    const order = await prisma.order.create({
      data: {
        userId: data.userId,
        email: data.email,
        amount: data.amount,
        status: data.status,
        products: data.products,
      },
    });

    // Directly trigger email confirmation in background
    if (order.email) {
      sendMail({
        email: order.email,
        subject: "Order Confirmation - E-Commerce",
        text: `Hello! Your order has been placed successfully. Amount: $${(order.amount / 100).toFixed(2)}, Status: ${order.status}`,
      }).catch((err) => console.log("Failed to send order email:", err));
    }

    return formatOrder(order);
  } catch (error) {
    console.log("Error creating order:", error);
    throw error;
  }
};
