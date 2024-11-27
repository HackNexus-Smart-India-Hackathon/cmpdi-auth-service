import expres from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { register, login,refreshToken,getAllUsers,getUserByRole,getUserById,updateUser,deleteUser } from "../controllers/auth.js";
import { generateSecret,verify2FA } from '../controllers/auth2fa.js';

const router = expres.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.get('/users', verifyToken, getAllUsers);
router.get("/users/:role", verifyToken, getUserByRole);
router.get("/user/:id", verifyToken, getUserById);
router.put("/user/:id", verifyToken, updateUser);
router.delete("/user/:id", verifyToken, deleteUser);

//2FA
router.post("/generate-secret/:id", generateSecret);
router.post("/verify-2fa/:id", verify2FA);

export default router; 