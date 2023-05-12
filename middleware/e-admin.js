module.exports = (req,res,next) => {
    if( req.user.eAdmin !== true){
        return res.redirect('/neautorizat');
    }
    next();
}