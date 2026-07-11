// Generates a signed JWT for the user, sets it as an httpOnly cookie,
// and also returns it in the JSON body so the frontend can store it
// (e.g. localStorage) and send it via Authorization headers as well.
const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  const token = user.getSignedJwtToken();

  const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRE || "7", 10);

  const options = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      message,
      token,
      user: user.toSafeObject ? user.toSafeObject() : user,
    });
};

export default sendTokenResponse;
