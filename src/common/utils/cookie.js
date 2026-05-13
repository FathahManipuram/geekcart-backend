export const COOKIE_NAMES= {
	USER_REFRESH_TOKEN: "user_refreshToken",
	ADMIN_REFRESH_TOKEN: "admin_refreshToken",
}


export const cookieOptions={
	httpOnly: true,
	secure: process.env.NODE_ENV=== "production",
	sameSite: "strict",
	maxAge: 7 * 24 * 60 * 60 * 1000,
}

export const setRefreshTokenCookie = (
	res, token, type= "user"
)=>{
const cookieName= type==="admin" ? COOKIE_NAMES.ADMIN_REFRESH_TOKEN
	: COOKIE_NAMES.USER_REFRESH_TOKEN

	res.cookie(cookieName, token, cookieOptions)
}

export const clearRefreshTokenCookie = (res, type= "user")=>{
const cookieName= type==="admin" ? COOKIE_NAMES.ADMIN_REFRESH_TOKEN	: COOKIE_NAMES.USER_REFRESH_TOKEN
res.clearCookie(cookieName, cookieOptions)
}