import { ApiError } from '../utils/APIerror.js';
import validator from 'validator';

const validateEmail = (email) => {
    if (!email || !validator.isEmail(email.trim())) {
        throw new ApiError(400, "Invalid email format");
    }
};

export {validateEmail}
