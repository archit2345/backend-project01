import { ApiError } from "../utils/APIerror.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        //in case of mobile apps or APIs, state management differently compared to web browsers. They often use local storage mechanisms provided by the mobile OS.Using the Authorization header allows for stateless authentication. The server does not need to maintain session state; it simply verifies the token on each request.
        
        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        //the fact that we donot remove access token because access token is not stored in user. Instead, they are issued by the server and sent to the client, which stores them (e.g., in cookies or local storage) and sends them with each request that requires authentication.
    
        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
        
        //By setting req.user to the authenticated user object, you make the user’s information available to subsequent middleware and route handlers.
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})