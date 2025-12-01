import Stripe from "stripe";
import dotenv from "dotenv";
import config from "../config";


dotenv.config();

export const stripe = new Stripe(config.stripeSecretKey as string);
