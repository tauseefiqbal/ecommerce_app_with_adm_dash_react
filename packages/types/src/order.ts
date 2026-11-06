import type { Order } from "@repo/db";

export type OrderProductItemType = {
  name: string;
  quantity: number;
  price: number;
};

export type OrderType = Omit<Order, "products"> & {
  _id: string;
  products: OrderProductItemType[];
};

export type OrderChartType = {
  month: string;
  total: number;
  successful: number;
};
