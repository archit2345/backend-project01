import mongoose, {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/APIrrror.js"
import {ApiResponse} from "../utils/APIresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req.user._id;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video Id is invalid")
    }

    if(!userId){
        throw new ApiError(400, "User doesnot exists")
    }

    const {content} = req.body;
    if(!content || typeof content !== "string"){
        throw new ApiError("400", "first add the content")
    }

    const comment = await Comment.create(
        {
            content: content,
            video : videoId,
            owner : userId
        }
    )

    if(!comment){
        throw new ApiError(404, "Doesnot able to get comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment successfully posted")
    )

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const userId = req.user._id;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Video Id is invalid")
    }

    if(!userId){
        throw new ApiError(400, "User doesnot exists")
    }

    const {newContent} = req.body;
    if(!newContent || typeof content !== "string"){
        throw new ApiError("400", "first add the content")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content: newContent
        },
        {new: true}
    )

    if(!updatedComment){
        throw new ApiError(404, "Not updated successfully")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedComment, "COMMENT UPDATED SUCCESSFULLY")
    )

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    const userId = req.user._id;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Video Id is invalid")
    }

    if(!userId){
        throw new ApiError(400, "User doesnot exists")
    }

    await Comment.findByIdAndDelete(commentId);

    return res
    .status(200)
    .json(
        new ApiResponse(200, [], "COMMENT DELETED SUCCESSFULLY")
    )
    
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }