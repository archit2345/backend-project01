import { ApiError } from '../utils/APIerror.js';

const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@#!])[A-Za-z\d@#!]{8,}$/;

    if (!password || !passwordRegex.test(password.trim())) {
        throw new ApiError(400, "Password must be at least 8 characters long and contain at least one letter, one number and one special character");
    }
};

export {validatePassword}
