import mongoose, {Schema} from "mongoose";

const tweetSchema = new Schema(
    {
        owner:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        content: {
            type : String,
            required : true,
            trim : true
        }
    },
    {timestamps: true}
)

export const Tweet = mongoose.model("Tweet", tweetSchema)