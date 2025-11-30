import { PrismaClient } from "@prisma/client";
import ApiError from "../../errors/ApiError"
import bcrypt from "bcryptjs"
import httpStatus from "http-status"
import { jwtHelper } from "../../helper/jwtHelper";
import config from "../../config";
import { Secret } from "jsonwebtoken";
import emailSender from "./emailSender";


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

const changePassword = async (user: any, payload: any) => {
    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: user.email
        }
    });

    const isCorrectPassword: boolean = await bcrypt.compare(payload.oldPassword, userData.password);

    if (!isCorrectPassword) {
        throw new Error("Password incorrect!")
    }

    const hashedPassword: string = await bcrypt.hash(payload.newPassword, Number(config.salt_round));

    await prisma.user.update({
        where: {
            email: userData.email
        },
        data: {
            password: hashedPassword
        }
    })

    return {
        message: "Password changed successfully!"
    }
};

const forgotPassword = async (payload: { email: string }) => {
    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: payload.email
        }
    });

    const resetPassToken = jwtHelper.generateToken(
        { email: userData.email, role: userData.role },
        config.JWT.RESET_PASS_SECRET as Secret,
        config.JWT.RESET_PASS_TOKEN_EXPIRES as string || '15m'
        // String(10 * 60 * 1000)
    )

    const resetPassLink = config.JWT.RESET_PASS_LINK + `?userId=${userData.id}&token=${resetPassToken}`

    await emailSender(
        userData.email,
        `
        <div>
            <p>Dear User,</p>
            <p>Your password reset link 
                <a href=${resetPassLink}>
                    <button>
                        Reset Password
                    </button>
                </a>
            </p>

        </div>
        `
    )
};

const resetPassword = async (token: string, payload: { id: string, password: string }) => {

    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            id: payload.id
        }
    });

    const isValidToken = jwtHelper.verifyToken(token, config.JWT.RESET_PASS_SECRET as Secret)

    if (!isValidToken) {
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden!")
    }

    // hash password
    const password = await bcrypt.hash(payload.password, Number(config.salt_round));

    // update into database
    await prisma.user.update({
        where: {
            id: payload.id
        },
        data: {
            password
        }
    })
};

const getMe = async (session: any) => {
    const accessToken = session.accessToken;
    const decodedData = jwtHelper.verifyToken(accessToken, config.JWT.JWT_ACCESS_SECRET as Secret);

    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: decodedData.email
        },
        select: {
            id: true,
            email: true,
            role: true,
            phone: true,
            addresses: {
                select: {
                    address: true,
                    city: true,
                    country: true,
                    postalCode: true
                }
            },
            createdAt: true,
            updatedAt: true
        }
    });

    return userData;

}

export const AuthService = {
    login,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
    getMe,
}