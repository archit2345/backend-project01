const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}


export { asyncHandler }

//TO understand it
// import { asyncHandler } from './path/to/asyncHandler';

// app.get('/example', asyncHandler(async (req, res, next) => {
//     const data = await someAsyncFunction();
//     res.send(data);
// }));

// (req, res, next) => {
//     Promise.resolve((async (req, res, next) => {
//         const data = await someAsyncFunction();
//         res.send(data);
//     })(req, res, next)).catch((err) => next(err));
// }





// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}


// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }