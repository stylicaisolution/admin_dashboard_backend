import express from 'express';
const router = express.Router();
import { sendMailDeveloperFromCompany, sendMailToDeveloper, sendMailToManager,sendRegisterMailManager, sendVerificationMail, verifyToken } from '../controller/mailController.js';  // Named import for the functions

// Route to request forgot password (email submission)
router.post('/send-mail', sendVerificationMail);

// Route to handle the verification of the token
router.get('/verify-token/:token', verifyToken);

//Send mail when cmanager create photoshop with front image
router.post('/send-mail-developer/:managerid',sendMailToDeveloper)

//Send mail when developer upload photoshoot
router.post('/send-mail-manager/:uploadid',sendMailToManager)

//Send manager mail
router.post('/send-manager-mail', sendRegisterMailManager);

//Send mail to developer by company
router.post('/send-dev-bycompany/:companyid',sendMailDeveloperFromCompany)

export default router;