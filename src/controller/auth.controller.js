import { createUser, findUser } from "../service/user.service.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    let { name, email, password } = req.body;
    //1. checking is existing user
    const existUser = await findUser({ email }, { id: 1 });
    if (existUser) {
      return res.fail(
        400,
        "User already registered with this email.Please use other email",
      );
    }
    //2. create user
    const user = await createUser({
      name,
      email,
      password,
    });
    //3. generate jwt token
    let token = jwt.sign({ userId: user.id }, process.env.JWT_KEY, {
      expiresIn: "24h",
    });
    user._doc.token = token;

    return res.success(201, "User registered successfully", user);
  } catch (error) {
    console.log("Register API Error:", error);
    return res.fail(500, "Internal server error");
  }
};

export const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    let user = await findUser({ email });
    //1. checking is existing user
    if (!user) {
      return res.fail(404, "User is not registered with this email");
    }
    //4. compare password
    if (user.password !== password) {
      return res.fail(400, "Incorrect password");
    }
    //5. generate jwt token
    let token = jwt.sign({ userId: user.id }, process.env.JWT_KEY, {
      expiresIn: "24h",
    });
    user._doc.token = token;
    return res.success(200, "User login successfully.", user);
  } catch (error) {
    console.log("Login API Error:", error);
    return res.fail(500, "Internal server error");
  }
};
