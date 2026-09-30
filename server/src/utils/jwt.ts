import jwt from "jsonwebtoken";

interface TokenPayload {
    userId: string;
}

export const generateToken = (userId: string) => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
        {
            userId
        },
        secret,
        {
            expiresIn: "7d"
        }
    );
};

export const verifyToken = (
    token: string
): TokenPayload => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.verify(
        token,
        secret
    ) as TokenPayload;
};