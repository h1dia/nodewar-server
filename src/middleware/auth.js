import basicAuth from 'express-basic-auth';
import dotenv from 'dotenv';

dotenv.config();

const adminUser = process.env.ADMIN_USER || 'admin';
const adminPass = process.env.ADMIN_PASS || 'password';
const users = {};
users[adminUser] = adminPass;

const authMiddleware = basicAuth({ users: users, challenge: true });

export default authMiddleware;
