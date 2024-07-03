import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/APIerror.js"
import {ApiResponse} from "../utils/APIresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { isVAT } from "validator"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;
    if(!content || typeof content !== "string"){
        throw new ApiError("400", "first add the content")
    }

    const user = User.findById(req.user?._id);
    if(!user){
        throw new ApiError(404, "User not found")
    }

    const tweet = await Tweet.create(
        {
            content : content
        }, 
        {
            owner: user
        }
    )

    if(!tweet){
        throw new ApiError(400, "Tweet creation unsuccessful")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Tweet created successfully")
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "User ID is wrong")
    }

    //extract the user
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(400, "User not found");
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {newContent} = req.body;
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, "Invalid Tweet is created")
    }

    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(404, "User not found")
    }

    const tweet = await Tweet.findById(tweetId, { owner: 1 });
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    // validate if the user is owner of this tweet
    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized To perform this action");
    }
  

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content: newContent
        },
        {
            new : true
        }
    );

    if(!updatedTweet){
        throw new ApiError(400, "Updated Tweet is not created")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedTweet, "Your Tweet is updated now")
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    //As given in routes , take out tweetId
    const {tweetId} = req.params

    //check if the tweetId is valid
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, "Tweet is not available")
    }
    //Find if there is any user associated with tweet
    const user = await User.findById(req.user?._id)

    //check if user is valid
    if(!user){
        throw new ApiError(404, "User doesnot exist, tweet is invalid")
    }
    //find the tweet and check the user who is deleting the tweet , whether it belongs to him or not
    const tweet = await Tweet.findById(tweetId, { owner: 1 });
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if(tweet.owner.toString() != req.user?._id.toString()){
        throw new ApiError(400, "You cannot delete other user's tweet")
    }

    // if it belongs to user , delete the tweet
    const deleteTweet = await Tweet.findByIdAndDelete(tweetId);
    if (!deleteTweet) {
        throw new ApiError(500, "some internal error occured while Deleting Tweet");
    }

    // return response
    return res
    .status(200)
    .json(new ApiResponse(200, [], "Tweet Deleted Successfully"));
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}