import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
    node_env: process.env.NODE_ENV,
    port: process.env.PORT,
    database_url: process.env.DATABASE_URL,
    salt_round: process.env.BCRYPT_SALT,
    cloudinary: {
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET
    },
    JWT:{
        JWT_ACCESS_SECRET : process.env.JWT_ACCESS_SECRET,
        JWT_ACCESS_EXPIRES : process.env.JWT_ACCESS_EXPIRES,
        
        JWT_REFRESH_SECRET : process.env.JWT_REFRESH_SECRET,
        JWT_REFRESH_EXPIRES : process.env.JWT_REFRESH_EXPIRES,
        
        RESET_PASS_SECRET : process.env.RESET_PASS_SECRET,
        RESET_PASS_TOKEN_EXPIRES : process.env.RESET_PASS_TOKEN_EXPIRES_IN,
        RESET_PASS_LINK : process.env.RESET_PASS_LINK,
    },
    emailSender: {
        email: process.env.EMAIL,
        app_pass: process.env.APP_PASS
    },
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebHookSecret: process.env.STRIPE_WEB_HOOK_SECRET,

    successUrl: process.env.SUCCESS_URL,
    cancelUrl: process.env.CANCEL_URL
}