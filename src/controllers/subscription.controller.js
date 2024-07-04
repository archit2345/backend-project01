import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/APIerror.js"
import {ApiResponse} from "../utils/APIresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // id of owner of channel
    const { channelId } = req.params;
    
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel");
    }

    // subscriber id
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(400, "Invalid User");
    }

    // Find the subscription
    const isSubscribed = await Subscription.findOne({ channel: channelId, subscriber: user._id });
    
    if (isSubscribed) {
        await Subscription.deleteOne({ channel: channelId, subscriber: user._id });
    } else {
        await Subscription.create({ channel: channelId, subscriber: user._id });
    }

    return res.status(200)
        .json(new ApiResponse(200, {}, isSubscribed ? "Unsubscribed Successfully" : "Subscribed Successfully"));
});


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    try {
        const {channelId} = req.params
    
        if (!isValidObjectId(channelId)) {
            throw new ApiError(400, "Invalid Channel");
        }
    
        // subscriber id
        const user = await User.findById(req.user?._id);
        if (!user) {
            throw new ApiError(400, "Invalid User");
        }
    
    
        //const subscriptions = await Subscription.find({ channel: subscriberId }).populate('subscriber');
        //above is also valid, if you want to look up for users then you need to use aggregate pipeline
        const subscriptions = await Subscription.aggregate([
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(channelId),
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "userDetails",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                avatar: 1,
                                fullName : 1
                            }
                        }
                    ]
                }
            }
        ])
    
        if(subscriptions.length() == 0){
            throw new ApiError(400, "Not able to fetch subscribers")
        }
    
        const subscribers = subscriptions.map(subscription => subscription.userDetails[0]);
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, subscribers, "Here are all the subscribers")
        )
    } catch (error) {
        throw new ApiError(500, "An error occurred while retrieving subscribers");
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid Channel");
    }

    const channelsSubscribed = await Subscription.aggregate(
        [
            {
                $match: {
                    subscriber : new mongoose.Types.ObjectId(subscriberId)
                }
            },

            {
                $lookup: {
                    from: "Users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscribeddd",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                fullName: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            }
        ]
    )

    const channels = channelsSubscribed.map(item => item.subscribeddd[0]);
    if(channels.length == 0){
        throw new ApiError(404, "No channels found")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, channels, "successful")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}

//aggregation list of subscribers
// [
//     {
//         "_id": "sub1",
//         "channel": "channel1",
//         "subscriber": "user1",
//         "userDetails": [
//             {
//                 "_id": "user1",
//                 "username": "userone",
//                 "avatar": "avatar1.jpg",
//                 "fullName": "User One"
//             }
//         ]
//     },
//     {
//         "_id": "sub2",
//         "channel": "channel1",
//         "subscriber": "user2",
//         "userDetails": [
//             {
//                 "_id": "user2",
//                 "username": "usertwo",
//                 "avatar": "avatar2.jpg",
//                 "fullName": "User Two"
//             }
//         ]
//     }
// ]