import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/APIerror.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/APIresponse.js"
import { validateUsername, validateEmail, validatePassword } from "../validation/index.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefereshTokens = async(userid) => {
    try {
        const user = await User.findById(userid)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler(async(req, res) => {
    //1) get user details from frontend
    const {fullName, email, username, password } = req.body
    console.log(req.body)

    //2) Validation
    if (!fullName?.trim()) {
        throw new ApiError(400, "Full name is required and cannot be empty");
    }
    validateEmail(email);
    validateUsername(username);
    validatePassword(password);

    //3) Check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }


    //4) check for images, check for avatar
    // Even if your application is designed to handle single file uploads for avatar and coverImage, multer still stores them in arrays for consistency and ease of handling. Thus, [0] ensures you correctly access the first (and typically the only) file uploaded under each field name.
    //console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    //console.log(avatarLocalPath)

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar Field is required")
    }


    //5) upload them to cloudinary, avatar check again
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }


    //6) Create user object - as mongoDB is No SQL so objects are generally loaded into this, - create entry in DB
    //Now thereis only user entity who is talking with user
    //as clodinary return response, return response.url
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //7) remove password and refresh token from response field 
    //mongo give every entry a unique id , we can access it by _id
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //8) Check for user creation 
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    //9) send response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
    

})

const loginUser = asyncHandler(async(req, res) => {
    //fetch details from req
    console.log(req.body)
    const {email, username, password} = req.body
    console.log(username)
    console.log(email)

    //Check if present and validity
    if(!(username || email)){
        throw new ApiError(400, "username or password is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User doesnot exist , first register for it")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(404, "Invalid User Credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    //now till here user object is not updated with access and refresh tokens , so we need to update user
    //now either we can update the user or call find query again
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true
        };

        // Corrected await usage within an async function
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
};


export {registerUser, loginUser, logoutUser, refreshAccessToken}