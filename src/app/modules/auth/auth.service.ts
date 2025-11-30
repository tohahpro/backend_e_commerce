import { PrismaClient } from "@prisma/client";
import ApiError from "../../errors/ApiError"
import bcrypt from "bcryptjs"
import httpStatus from "http-status"
import { jwtHelper } from "../../helper/jwtHelper";
import config from "../../config";
import { Secret } from "jsonwebtoken";


const prisma = new PrismaClient();


const login = async (payload: { email: string, password: string }) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: {
            email: payload.email
        }
    })

    const isCorrectPassword = await bcrypt.compare(payload.password, user.password)
    if (!isCorrectPassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Password is incorrect.")
    }
    const jwtPayload = {
        email: user.email,
        role: user.role
    }
    const accessToken = jwtHelper.generateToken(jwtPayload, config.JWT.JWT_ACCESS_SECRET as string, config.JWT.JWT_ACCESS_EXPIRES as string)

    const refreshToken = jwtHelper.generateToken(jwtPayload, config.JWT.JWT_REFRESH_SECRET as string, config.JWT.JWT_REFRESH_EXPIRES as string)

    return {
        accessToken,
        refreshToken       
    };
}

const refreshToken = async (token: string) => {
    let decodedData;
    try {
        decodedData = jwtHelper.verifyToken(token, config.JWT.JWT_REFRESH_SECRET as Secret);
    }
    catch (err) {
        throw new Error("You are not authorized!")
    }

    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: decodedData.email
        }
    });

    const accessToken = jwtHelper.generateToken({
        email: userData.email,
        role: userData.role
    },
        config.JWT.JWT_REFRESH_SECRET as Secret,
        config.JWT.JWT_REFRESH_EXPIRES as string
    );

    return {
        accessToken
    };

};


export const AuthService = {
    login, 
    refreshToken, 
}