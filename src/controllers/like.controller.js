import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/APIrrror.js"
import {ApiResponse} from "../utils/APIresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Tweet} from "../models/tweets.model.js"
import {User} from "../models/user.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Object Id")
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "No Video Found")
    }

    const likedVideo = await Like.findOne({video : videoId} , {_id: 1})

    let isLiked;
    if(!likedVideo){
        isLiked = await Like.create({
            video  :videoId,
            likedBy : req.user?._id
        })
    }
    else{
        isLiked  = await Like.deleteOne(likedVideo)
    }

    return res.status(200)
        .json(new ApiResponse(200, isLiked , likedVideo ? "video like removed" : "video liked"))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Object Id")
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "No Comment Found")
    }

    const likedComment = await Like.findOne({comment : commentId} , {_id: 1})

    let isLiked;
    if(!likedComment){
        isLiked = await Like.create({
            comment  :commentId,
            likedBy : req.user?._id
        })
    }
    else{
        isLiked = await Like.deleteOne(likedComment)
    }
    
    return res.status(200)
        .json(new ApiResponse(200, isLiked , likedComment ? "comment like removed" : "Comment liked"))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const user = req.user?._id;
    //TODO: toggle like on tweet

    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, "Invalid Object id")
    }

    const tweet = await Tweet.findOne(tweetId);
    if(!tweet){
        throw new ApiError(404, "No such tweet found")
    }

    const likedTweet = await Like.findOne(
        {tweet : tweetId},
        {
            _id: 1
        }
    )

    let isLiked;
    if(!likedTweet){
        isLiked = await Like.create({
            tweet  :tweetId,
            likedBy : req.user?._id
        })
    }
    else{
        isLiked = await Like.deleteOne(likedTweet)
    }

    return res
    .status(200)
    .json(new ApiResponse(200, isLiked, likedTweet ? "tweet like removed" : "Tweet liked"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "liked",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    },
                    {
                        $project: {
                            title: 1,
                            description: 1,
                            thumbnail: "$thumbnail.url",
                            owner: 1
                        }
                    }
                ]
            }
        }
    ]);

    if (!likedVideos.length) {
        throw new ApiError(404, "No liked videos found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, likedVideos[0], "Liked video fetched successfully")
        );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}