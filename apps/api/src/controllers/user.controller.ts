import { Request, Response } from "express";
import clerkClient from "../utils/clerk.js";
import sendMail from "../utils/mailer.js";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await clerkClient.users.getUserList();
    return res.status(200).json(users);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch users!" });
  }
};

export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "User ID is required!" });
  }
  try {
    const user = await clerkClient.users.getUser(id);
    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch user!" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    type CreateParams = Parameters<typeof clerkClient.users.createUser>[0];
    const newUser: CreateParams = req.body;
    const user = await clerkClient.users.createUser(newUser);

    const email = user.emailAddresses[0]?.emailAddress;
    const username = user.username || user.firstName || "User";

    if (email) {
      sendMail({
        email,
        subject: "Welcome to E-Commerce",
        text: `Welcome ${username}! Your account has been created successfully.`,
      }).catch((err) => console.log("Failed to send welcome email:", err));
    }

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: (error as Error).message || "Failed to create user!" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "User ID is required!" });
  }
  try {
    const user = await clerkClient.users.deleteUser(id);
    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to delete user!" });
  }
};
