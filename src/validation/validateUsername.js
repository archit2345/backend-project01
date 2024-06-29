import { ApiError } from '../utils/APIerror.js';

const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]+$/; // Only allows letters, numbers, and underscores
    if (!username || username.trim().length < 3 || !usernameRegex.test(username)) {
        throw new ApiError(400, "Username must be at least 3 characters long and can only contain letters, numbers, and underscores");
    }
};

export {validateUsername}
