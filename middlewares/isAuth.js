const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authToken = req.get('Authorization');
    if(!authToken){
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error;
    }
    const token = authToken;
    let decodedToken;
    try{
        decodedToken = jwt.verify(token, 'secret');
    } catch (err) {
        err.statusCode = 500
        throw err;
    }

    if (!decodedToken) {
        const error = new Error('Not Authenticated');
        error.statusCode = 401;
        throw error
    }
    req.userId = decodedToken.userId;
    next();
}