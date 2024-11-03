import { Router } from 'express';
import  {signupOTPVerify, signupResendOTP, userRegistration, userLogin,userUpdatebyToken, getUserAccountInfo, userUpdateByAdmin,passwordUpdateByAdmin, userList, sendPasswordResetOtp, otpVerifyForResetPassword, changePasswordForOtpRequest, passwordResetByToken, userVerify, employeeCreate, fetchEmployeeRoles, employeeList, filteringEmployeeList, deleteUser, verifyGoogleUser }  from '../../controllers/user.controller';
import { authCheck, isAdmin, isLoggedIn } from '../../middlewares/auth';

const userRoutes = Router();

userRoutes.post('/register', userRegistration);
userRoutes.post('/signup-otp-verify', signupOTPVerify);
userRoutes.post('/signup-resend-otp', signupResendOTP);

userRoutes.post('/login', userLogin);
userRoutes.get('/verify',isLoggedIn, userVerify);

userRoutes.get('/list', authCheck({isAdmin: true, isEmployee: true}), userList);
userRoutes.get('/details', isLoggedIn, getUserAccountInfo);
userRoutes.post('/update',isLoggedIn , userUpdatebyToken)

userRoutes.post('/update-by-admin', authCheck({isAdmin: true, isEmployee: true}), userUpdateByAdmin);
userRoutes.post('/password-update-by-admin', isAdmin, passwordUpdateByAdmin);

userRoutes.post('/send-reset-otp', sendPasswordResetOtp);
userRoutes.post('/verify-reset-otp', otpVerifyForResetPassword);
userRoutes.post('/password-reset-by-otp', changePasswordForOtpRequest);

userRoutes.post('/password-reset-by-token', isLoggedIn, passwordResetByToken);


userRoutes.post('/employee', authCheck({isAdmin: true, isEmployee: true}), employeeCreate);
userRoutes.get('/employee/roles', authCheck({isAdmin: true, isEmployee: true}), fetchEmployeeRoles);

userRoutes.post('/employee-create', authCheck({isAdmin: true, isEmployee: true}), employeeCreate);
userRoutes.get('/employee-list',authCheck({isAdmin: true, isEmployee: true}), employeeList);
userRoutes.get('/filtering-employees', filteringEmployeeList);

//delete user
userRoutes.delete('/', authCheck({isAdmin: true, isEmployee: true}), deleteUser)


userRoutes.post("/verify-google-user", verifyGoogleUser);




export default userRoutes;