import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/APIerror.js"
import {ApiResponse} from "../utils/APIresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, getCloudinaryPublicId, uploadOnCloudinary} from "../utils/cloudinary.js"
import { configDotenv } from "dotenv"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title.trim() || !description.trim()) {
        throw new ApiError(401, "First provide the title and description");
    }

    try {
        // Fetch the video file from user
        const videoLocalPath = req.files?.videoFile?.path;
        if (!videoLocalPath) {
            throw new ApiError(401, "For publishing a video, first send the video file");
        }

        // Fetch the thumbnail from user
        const thumbnailLocalPath = req.files?.thumbnail?.path;
        if (!thumbnailLocalPath) {
            throw new ApiError(401, "Please send the thumbnail first for publishing a video");
        }

        // Fetch the user
        const user = await User.findById(req.user?._id);
        if (!user) {
            throw new ApiError(400, "Register in the system first");
        }

        // Upload video to Cloudinary
        const video = await uploadOnCloudinary(videoLocalPath);
        if (!video.url) {
            throw new ApiError(400, "Uploading the video on Cloudinary failed");
        }

        // Upload thumbnail to Cloudinary
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if (!thumbnail.url) {
            throw new ApiError(400, "Uploading the thumbnail on Cloudinary failed");
        }

        const duration = video.duration;

        // Create video in database
        const videoToBeUploaded = await Video.create({
            videoFile: video.url,
            thumbnail: thumbnail.url,
            title,
            description,
            duration,
            owner: user._id,
            isPublished: true,
            views: 0
        });

        if (!videoToBeUploaded) {
            throw new ApiError(401, "Video is not uploaded. Try again!");
        }

        return res.status(200).json(
            new ApiResponse(200, videoToBeUploaded, "Video Published Successfully")
        );
    } catch (error) {
        // Handle any unexpected errors
        throw new ApiError(500, error.message || "An unexpected error occurred");
    }
});

const incrementVideoViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    try {
        const video = await Video.findById(videoId);
        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        video.views += 1;
        await video.save();

        return res.status(200).json(
            new ApiResponse(200, video, "Video view count incremented successfully")
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An unexpected error occurred");
    }
});

//learning
//1) If user gets the video , then its view should be increased by 1
//2) Video should be added in user's watch history
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!isValidObjectId(videoId)){
        throw new ApiError(401, "Invalid Video Id")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "The video you are trying to get is not present")
    }

    //find owner of video
    const user = await User.findById(req.user?._id, { watchhistory: 1 });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if(!user.watchHistory.includes(videoId)){
        await Video.findByIdAndUpdate(
            videoId,
            {
              $inc: {
                views: 1,
              },
            },
            { new: true }
          );
    }

    // add video to users watchHistory
    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchhistory: videoId,
        },
    });

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video given")
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid VideoID")
    }

    const thumbnailLocalPath = req.file?.path
    const {content: updatedContent, description: updatedDescription} = req.body
    if(!updatedContent || !updatedDescription || !thumbnailLocalPath){
        throw new ApiError(400, "Fields are requried")
    }
    
    const oldVideo = await Video.find(videoId);
    if(!oldVideo){
        throw new ApiError(400, "The video you are trying to access doesnot exists")
    }

    let oldThumbnailPublicId;
    if(oldVideo.thumbnail){
        oldThumbnailPublicId = await getCloudinaryPublicId(oldVideo.thumbnail)
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnail){
        throw new ApiError(400, "Try Again! Thumbnail is not uploaded to cloudinary")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            thumbnail : thumbnail.url,
            content: updatedContent,
            description: updatedDescription
        },
        {
            new: true
        }
    )

    if(oldThumbnailPublicId){
        try {
            await deleteFromCloudinary(oldThumbnailPublicId);
        } catch (error) {
            console.error("Error deleting old Thumbnail from Cloudinary: ", error);
        }
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo, "Video Updated Successfully")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid VideoId")
    }

    //Find the user who is owner of video
    const user = await User.findById(req.user?._id);
    if(!user){
        throw new ApiError(401, "Unauthorized Request")
    }

    //if video exists with that id we are trying to delete
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if(req.user?._id.toString() == video.owner.toString()){
        throw new ApiError(400, "You cannot delete other user's video")
    }

    const deleteVideo = await Video.findByIdAndDelete(videoId);
    if (!deleteVideo) {
        throw new ApiError(500, "some internal error occured while Deleting Video");
    }

    // return response
    return res
    .status(200)
    .json(new ApiResponse(200, [], "Video Deleted Successfully"));

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Object Id")
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "No Video Found")
    }

    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(400, "User doesnot exists")
    }

    //we can also use this or directly pass userId in find by Id and update
    // if(req.user?._id.toString() == video.owner.toString()){
    //     throw new ApiError(400, "You cannot delete other user's video")
    // }

    const toggled = await Video.findByIdAndUpdate(
        {
            _id: videoId,
            owner : req.user?._id
        },
        {
            $set: {
                isPublished : !isPublished
            }
        }
    )

    if(!toggled){
        throw new ApiError(400, "Sorry is Published not toggled")
    }

    return res
    .status(200)
    .json(200, toggled, "Toggle publish status successfully")
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    incrementVideoViews,
    deleteVideo,
    togglePublishStatus
}