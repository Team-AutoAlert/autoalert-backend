const checkRole = (roles) => {
    return (req, res, next) => {
        const userRole = req.user.role;
        if (roles.includes(userRole)) {
            next();
        } else {
            res.status(403).json({
                success: false,
                error: 'Unauthorized',
                message: 'You do not have permission to perform this action'
            });
        }
    };
};

module.exports = {
    checkRole
};
