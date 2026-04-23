export const otpTemplate=(otp)=>{
	return `
	<div style="font-family: Arial; padding: 20px;">
	<h2>Verify Your Email</h2>
	<p>Your OTP is: </p>
	<h1 style:"color: #4caf50;">${otp}</h1>
	<p>This otp is valid for 10 minutes</p>
	</div>`
}