import { prismaClient } from "../lib/db";
import { createHmac, randomBytes } from "node:crypto";
import JWT from "jsonwebtoken";

const JWT_SECRET = "secret";

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface GetUserTokenPayload {
  email: string;
  password: string;
}

class UserService {
  private static generateHash(salt: string, password: string) {
    const hashedPassword = createHmac("sha256", salt)
      .update(password)
      .digest("hex");
    return hashedPassword;
  }

  public static getUserById(id: string) {
    return prismaClient.user.findUnique({ where: { id } });
  }

  public static createUser(payload: CreateUserPayload) {
    const { firstName, lastName, email, password } = payload;

    const salt = randomBytes(32).toString("hex");
    const hashedPassword = UserService.generateHash(salt, password);

    return prismaClient.user.create({
      data: {
        firstName: firstName,
        lastName: lastName,
        email: email,
        salt: salt,
        password: hashedPassword,
      },
    });
  }

  private static getUserByEmail(email: string) {
    return prismaClient.user.findUnique({ where: { email } });
  }

  public static async getUserToken(payload: GetUserTokenPayload) {
    const { email, password } = payload;
    const user = await this.getUserByEmail(email);

    if(!user){
      throw new Error("User not found");
    }

    const passsalt=user.salt;
    const userHashPassword=this.generateHash(passsalt,password);

    if(user.password!==userHashPassword){
      throw new Error("Passwords don't match");
    }

    const token=JWT.sign({id:user.id,email:user.email},JWT_SECRET);
    return token;
  }

  public static decodeToken(userToken:string){
    return JWT.verify(userToken,JWT_SECRET)
  }
}

export default UserService;
