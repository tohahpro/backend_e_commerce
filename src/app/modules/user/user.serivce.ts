import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcryptjs';
import config from "../../config";



const prisma = new PrismaClient();

const registerUser = async (payload: any) => {
  const { name, email, phone, password, role } = payload;

  // check if user exists
  const isExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isExist) {
    throw new Error("Email already exists");
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, Number(config.salt_round));

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || "CUSTOMER",
    },
  });

  // remove password from returned data
  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    phone: newUser.phone,
    role: newUser.role,
    createdAt: newUser.createdAt,
  };
};

export const UserService = {
  registerUser,
};
