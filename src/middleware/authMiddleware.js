import jwt from "jsonwebtoken";
import { findUser } from "../service/user.service.js";
export const auth = async (req, res, next) => {
  //1. fatch token
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.fail(400, "Access denied. No authorization token provided");
  }
  try {
    //2. decoded token
    let decoded = jwt.verify(token, process.env.JWT_KEY);
    const user = await findUser({ _id: decoded.userId }, { _id: 1 });
    //3. checking user existing
    if (!user) {
      return res.fail(404, "This user is not found");
    }
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name == "TokenExpiredError") {
      return res.fail(401, "Token expired");
    }
    console.log("Internal server error", error);
    return res.fail(500, "Invalid token.");
  }
};
