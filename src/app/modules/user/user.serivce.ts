import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcryptjs';
import config from "../../config";
import { jwtHelper } from "../../helper/jwtHelper";
import { Secret } from "jsonwebtoken";



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


const updateProfile = async (session: any, payload: any) => {
  const { name, phone, address } = payload;

  const accessToken = session?.accessToken;
  if (!accessToken) {
    throw new Error("Unauthorized request");
  }

  const decodedData: any = jwtHelper.verifyToken(
    accessToken,
    config.JWT.JWT_ACCESS_SECRET as Secret
  );

  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: decodedData.email },
    select: {
      id: true,
      name: true,
      phone: true,
      addresses: {
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
          city: true,
          postalCode: true,
          country: true,
        },
      },
    },
  });

  const existingAddress = userData.addresses?.[0]; // 1 user = 1 address

  return await prisma.$transaction(async (tx) => {

    const updatedUser = await tx.user.update({
      where: { id: userData.id },
      data: {
        name: name !== undefined ? name : userData.name,
        phone: phone !== undefined ? phone : userData.phone,
      },
    });

    let updatedAddress = null;


    if (address) {
      if (existingAddress) {
        
        updatedAddress = await tx.address.update({
          where: { id: existingAddress.id },
          data: {
            name: address.name !== undefined ? address.name : existingAddress.name,
            phone: address.phone !== undefined ? address.phone : existingAddress.phone,
            address: address.address !== undefined ? address.address : existingAddress.address,
            city: address.city !== undefined ? address.city : existingAddress.city,
            postalCode:
              address.postalCode !== undefined
                ? address.postalCode
                : existingAddress.postalCode,
            country:
              address.country !== undefined
                ? address.country
                : existingAddress.country ?? "Bangladesh",
          },
        });
      } else {
        
        updatedAddress = await tx.address.create({
          data: {
            userId: userData.id,
            name: address.name,
            phone: address.phone,
            address: address.address,
            city: address.city,
            postalCode: address.postalCode,
            country: address.country || "Bangladesh",
          },
        });
      }
    }

    return {
      user: updatedUser,
      address: updatedAddress ?? existingAddress ?? null,
    };
  });
};


export const UserService = {
  registerUser,
  updateProfile,
};
