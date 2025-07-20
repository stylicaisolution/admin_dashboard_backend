import jwt from 'jsonwebtoken';
import User from '../models/LOGINMAPPING.js';
import DEVELOPER from '../models/DEVELOPER.js';
import CMANAGER from '../models/CMANAGER.js';
import COMPANY from '../models/COMPANY.js';
import nodemailer from 'nodemailer';
import Upload from '../models/UPLOAD.js';
import Email from '../models/EMAIL.js';
import dotenv from "dotenv";

dotenv.config();

 // Send email with the token link
 const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.USER_USERNAME,
    pass: process.env.USER_APP_PASS,
  },
  tls: {
    rejectUnauthorized: true,
  },
});


// Function to handle forgot password logic
export const sendVerificationMail = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the email exists in the database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Create a JWT token with the user's _id
    const token = jwt.sign({ id: user._id }, process.env.JWT, { expiresIn: '30m' });

    const mailOptions = {
      from: process.env.USER_MAIL,
      to: email,
      subject: 'Password Reset Request',
      html: `
      <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
        }
        .email-container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 20px;
        }
        .header h2 {
            color: #333333;
            font-size: 24px;
            margin: 0;
        }
        .content {
            color: #555555;
            font-size: 16px;
            line-height: 1.6;
        }
        .content p {
            margin: 10px 0;
        }
        .button-container {
            text-align: center;
            margin: 20px 0;
        }
        .button-container a {
            background-color: #007bff;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 16px;
            display: inline-block;
        }
        .footer {
            color: #999999;
            font-size: 14px;
            text-align: center;
            margin-top: 20px;
            line-height: 1.6;
        }
        .footer a {
            color: #007bff;
            text-decoration: none;
        }
        @media (max-width: 600px) {
            .email-container {
                width: 100%;
            }
            .header h2 {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h2>Password Reset Request</h2>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password. If you made this request, please click the button below to reset your password:</p>
            <div class="button-container">
                <a href="${process.env.FRONT_URL}/verify-token/${token}">Reset Password</a>
            </div>
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div class="footer">
            <p>Thank you,<br />The Support Team</p>
            <p>&copy; 2025 AnantaSolution. All rights reserved.<br>
            <a href="mailto:info@anantasolution.com”>Contact Us</a></p>
        </div>
    </div>
</body>
</html>
      `
    };

    await transporter.sendMail(mailOptions);

    // Save email details in MongoDB
    const emailRecord = new Email({
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        body: mailOptions.html // Store HTML content
    });

    await emailRecord.save(); // Save email data

    return res.status(200).json({ message: 'Password reset link sent to your email' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong, please try again later' });
  }
};

// Function to verify the token and reset password
export const verifyToken = async (req, res) => {
  const { token } = req.params;

  try {
    // verify the token using jwt
    const decoded = jwt.verify(token, process.env.JWT);  // Make sure you're using the correct secret

    // Find the user by decoded id
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found',data:false });
    }

    // Token verified successfully
    return res.status(200).json({ message: 'Token verified successfully',data:true,id:user._id });

  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
};


//Send mail to developer when acmanager create upload folder
export const sendMailToDeveloper = async (req, res , next) =>{
   try{
     const {managerid} = req.params
     if(!managerid) return res.status(404).json({message:"Manager id is not given"})

     const manager = await CMANAGER.findById(managerid)

     if(!manager) return res.status(404).json({message:"Manager is not found by given id."})

     const companyId = manager.assignto

     if(!companyId) return res.status(404).json({message:"Company of manager is not found."})

     const company = await COMPANY.findById(companyId)

     if(!company) return res.status(404).json({message:"Company is not found"})

     const developerId = company.developer
 
     if(!developerId) return res.status(404).json({message:"Your company have no any developer"})

     const develoepr = await DEVELOPER.findById(developerId)

     if(!develoepr) return res.status(404).json({message:"Developer not found."})


     const mailOptions = {
      from: process.env.USER_MAIL,
      to: develoepr.email,
      subject: 'Request for new photoshoot',
      html: `
      <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Garment Photoshoot Request</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .email-container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #2d3e50;
            padding: 20px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px;
            color: #333333;
        }
        .content h2 {
            font-size: 20px;
            color: #2d3e50;
            margin-top: 0;
        }
        .content p {
            line-height: 1.6;
        }
        .content ul {
            padding-left: 20px;
        }
        .content ul li {
            margin-bottom: 10px;
        }
        .footer {
            background-color: #2d3e50;
            color: white;
            text-align: center;
            padding: 10px;
            font-size: 14px;
        }
        .footer a {
            color: #ffffff;
            text-decoration: none;
        }
        @media (max-width: 600px) {
            .email-container {
                width: 100%;
            }
            .header h1 {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>New Garment Photoshoot Request</h1>
        </div>
        <div class="content">
            <p>Dear Developer,</p>
            <p>I hope you're doing well.</p>
            <p>We have received a request from the client for a new garment photoshoot, and I would like to coordinate with you on the necessary preparations for this photoshoot</p>
            <p>Once we have all the details, we’ll finalize the plan and ensure everything is in place for a smooth execution.</p>
            <p>Please let me know if you need any further information.</p>
            <p>Best regards,<br>
            Harshit Gadhiya<br>
            CTO<br>
            +91-9316727742<br>
            Ananta Solution</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 Ananta Solution, All rights reserved.</p>
            <p><a href="mailto:info”@anantasolution.com>Contact Us</a></p>
        </div>
    </div>
</body>
</html>
      `
    };

    await transporter.sendMail(mailOptions);

    // Save email details in MongoDB
    const emailRecord = new Email({
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        body: mailOptions.html // Store HTML content
    });

    await emailRecord.save(); // Save email data

    return res.status(200).json({ message: 'Successfully mail sended to developer.'});

   }catch(err){
    next(err)
   }
}

export const sendMailToManager = async (req, res, next) =>{
    try{
      const { uploadid } = req.params
      if(!uploadid) return res.status(404).json({message:"Folder id is not provided."})

      const upload = await Upload.findById(uploadid)

      if(!upload) return res.status(404).json({message:"Folder is not found."})

      let user = null
      
      if(upload.createdByModel==="company"){
        user = await COMPANY.findById(upload.createdBy)

        if(!user) return res.status(404).json({message:"Company is not found.",status:404})
      }else if(upload.createdByModel==="cmanager"){
        user = await CMANAGER.findById(upload.createdBy)

        if(!user) return res.status(404).json({message:"Manager is not found.",status:404})
      }


      const company = await COMPANY.findById(upload.company)

      if(!company) return res.status(404).json({message:'Company is not found.',status:404})

      const develoepr = await DEVELOPER.findById(company.developer)

      if(!develoepr) return res.status(404).json({message:"Developer not found.",status:404})

      
      const mailOptions = {
        from: process.env.USER_MAIL,
        to: user.email,
        subject: 'Photoshoot Completed.',
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Photoshoot Completion Notification</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f9f9f9;
                }
                .email-container {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                }
                .header {
                    background-color: #2d3e50;
                    color: white;
                    text-align: center;
                    padding: 20px;
                }
                .header h1 {
                    font-size: 24px;
                    margin: 0;
                }
                .content {
                    color: #555555;
                    font-size: 16px;
                    line-height: 1.6;
                    padding: 20px 0;
                }
                .content p {
                    margin: 10px 0;
                }
                .button-container {
                    text-align: center;
                    margin: 20px 0;
                }
                .button-container a {
                    background-color: #007bff;
                    color: white;
                    text-decoration: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    font-size: 16px;
                    display: inline-block;
                }
                .footer {
                    color: #999999;
                    font-size: 14px;
                    text-align: center;
                    margin-top: 20px;
                    line-height: 1.6;
                }
                .footer a {
                    color: #007bff;
                    text-decoration: none;
                }
                @media (max-width: 600px) {
                    .email-container {
                        width: 100%;
                    }
                    .header h1 {
                        font-size: 20px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>Photoshoot Completed!</h1>
                </div>
                <div class="content">
                    <p>Dear Client,</p>
                    <p>We are excited to inform you that your garment photoshoot has been successfully completed.</p>
                    <p>You can now review the photos and access all the related materials in your Stylic dashboard.</p>
                    <div class="button-container">
                        <a href="${process.env.FRONT_URL}/cmanager/showcase" target="_blank">View Photoshoot</a>
                    </div>
                    <p>Thank you for choosing our service. We look forward to collaborating with you again!</p>
                </div>
                <div class="footer">
                    <p>Best regards,<br />The Stylic Team</p>
                    <p>&copy; 2025 Stylic. All rights reserved.<br>
                    <a href="mailto:noreply@stylic.ai”>Contact Us</a></p>
                </div>
            </div>
        </body>
        </html>
        `
      };

      
    await transporter.sendMail(mailOptions);


    // Save email details in MongoDB
        const emailRecord = new Email({
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            body: mailOptions.html // Store HTML content
        });

        await emailRecord.save(); // Save email data

    return res.status(200).json({ message: 'Successfully mail sended to manager.'});
  

    }catch(err){
      next(err)
    }
}


export const sendRegisterMailManager = async (req, res) => {
    const { managerMail, managerName, password } = req.body;
  
    if (!managerMail || !managerName || !password) {
      return res.status(400).json({ error: "managerMail, managerName, and password are required" });
    }
  
    try {
      // Configure Gmail SMTP Transport (Without host)
      const transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 587,
        secure: false, // Use STARTTLS
        auth: {
          user: process.env.USER_USERNAME,
          pass: process.env.USER_APP_PASS,
        },
        tls: {
          rejectUnauthorized: true,
        },
      });
  
  
      const mailOptions = {
        from: process.env.USER_MAIL, // Test sender email
        to: managerMail, // Test recipient email
        subject: "Your account has been successfully Created.",
        html: `
         <center>
  <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" style="background-color:rgb(244,244,244)">
  <tbody>
  <tr>
  <td align="center" valign="top">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:660px">
  <tbody>
  <tr>
  <td style="background-color:#ffffff" valign="top">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tbody>
  <tr>
  <td style="padding:12px 48px" align="center">
  <a href="https://stylic.ai" style="display:block" target="_blank">
  <img width="248" style="width:248px;height:auto;max-width:248px;border-radius:0;display:block" alt="Logo" src="https://mcusercontent.com/ae9eac00872dae7fa15fef3a3/images/faff145d-1f7b-bb53-6b31-78b40111c8de.png">
  </a>
  </td>
  </tr>
  <tr>
  <td style="padding:12px 24px">
  <p><strong>Hello ${managerName},</strong></p>
  <p>Welcome to <strong>Stylic.ai</strong>! Your account has been successfully created. You can now log in and start using our AI-powered photoshoot services.</p>
  <p><strong>Login Details:</strong></p>
  <p>🔗 <strong>URL:</strong> <a href="https://app.stylic.ai" target="_blank">https://app.stylic.ai</a></p>
  <p>👤 <strong>User ID:</strong> ${managerMail}</p>
  <p>🔑 <strong>Password:</strong> ${password}</p>
  <p>If you need any assistance, feel free to reach out to our support team.</p>
  </td>
  </tr>
  <tr>
  <td style="padding:12px" align="center">
  <table align="center" border="0" cellpadding="0" cellspacing="0" style="max-width:282px">
  <tr>
  <td style="background-color:#000000;border-radius:14px;text-align:center">
  <a href="https://app.stylic.ai" style="background-color:#000000;border-radius:14px;border:2px solid #000000;color:#ffffff;display:block;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;padding:16px 28px;text-decoration:none;text-align:center" target="_blank">Login</a>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td align="center" style="padding:24px 0">
  <table align="center" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td style="padding:3px 12px">
  <a href="https://facebook.com/" target="_blank">
  <img width="40" height="40" alt="Facebook" src="https://cdn-images.mailchimp.com/icons/social-block-v3/block-icons-v3/facebook-filled-dark-40.png">
  </a>
  </td>
  <td style="padding:3px 12px">
  <a href="https://instagram.com/" target="_blank">
  <img width="40" height="40" alt="Instagram" src="https://cdn-images.mailchimp.com/icons/social-block-v3/block-icons-v3/instagram-filled-dark-40.png">
  </a>
  </td>
  <td style="padding:3px 12px">
  <a href="https://linkedin.com/" target="_blank">
  <img width="40" height="40" alt="LinkedIn" src="https://cdn-images.mailchimp.com/icons/social-block-v3/block-icons-v3/linkedin-filled-dark-40.png">
  </a>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td style="padding:8px 16px" align="center">
  <p>Thank you,<br>The Support Team</p>
  <p>© 2025 AnantaSolution. All rights reserved.</p>
  </td>
  </tr>
  </tbody>
  </table>
  </td>
  </tr>
  </tbody>
  </table>
  </td>
  </tr>
  </tbody>
  </table>
  </center>
        `,
      }; 
  
      // Send email securely
      await transporter.sendMail(mailOptions);

      // Save email details in MongoDB
      const emailRecord = new Email({
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        body: mailOptions.html // Store HTML content
    });

    await emailRecord.save(); // Save email data
    
  
      return res.status(200).json({ success: true, message: "Test email sent successfully" });
    } catch (error) {
      console.error("Email sending error:", error);
      return res.status(500).json({ error: "Failed to send test email" });
    }
  };


export const sendMailDeveloperFromCompany = async (req, res, next) =>{
    try{
        const {companyid} = req.params

        if(!companyid) return res.status(400).json({message:"Company id is not defined.",status:400})

        const company = await COMPANY.findById(companyid)

        if(!company) return res.status(404).json({message:"Company is not defined.",status:404})

        let developerId = company.developer
        
        if(!developerId) return res.status(400).json({message:"Developer is not assigned to company.",status:400})

        const developer = await DEVELOPER.findById(developerId)

        if(!developer) return res.status(404).json({message:"Developer is not found.",status:404})


       const mailOptions = {
        from: process.env.USER_MAIL,
        to: developer.email,
        subject: 'Request for new photoshoot',
        html: `
        <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Garment Photoshoot Request</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
          }
          .email-container {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
              background-color: #2d3e50;
              padding: 20px;
              text-align: center;
              color: white;
          }
          .header h1 {
              margin: 0;
              font-size: 24px;
          }
          .content {
              padding: 20px;
              color: #333333;
          }
          .content h2 {
              font-size: 20px;
              color: #2d3e50;
              margin-top: 0;
          }
          .content p {
              line-height: 1.6;
          }
          .content ul {
              padding-left: 20px;
          }
          .content ul li {
              margin-bottom: 10px;
          }
          .footer {
              background-color: #2d3e50;
              color: white;
              text-align: center;
              padding: 10px;
              font-size: 14px;
          }
          .footer a {
              color: #ffffff;
              text-decoration: none;
          }
          @media (max-width: 600px) {
              .email-container {
                  width: 100%;
              }
              .header h1 {
                  font-size: 20px;
              }
          }
      </style>
  </head>
  <body>
      <div class="email-container">
          <div class="header">
              <h1>New Garment Photoshoot Request</h1>
          </div>
          <div class="content">
              <p>Dear Developer,</p>
              <p>I hope you're doing well.</p>
              <p>We have received a request from the client for a new garment photoshoot, and I would like to coordinate with you on the necessary preparations for this photoshoot</p>
              <p>Once we have all the details, we’ll finalize the plan and ensure everything is in place for a smooth execution.</p>
              <p>Please let me know if you need any further information.</p>
              <p>Best regards,<br>
              Harshit Gadhiya<br>
              CTO<br>
              +91-9316727742<br>
              Ananta Solution</p>
          </div>
          <div class="footer">
              <p>&copy; 2025 Ananta Solution, All rights reserved.</p>
              <p><a href="mailto:info”@anantasolution.com>Contact Us</a></p>
          </div>
      </div>
  </body>
  </html>
        `
       };


      await transporter.sendMail(mailOptions);

      // Save email details in MongoDB
      const emailRecord = new Email({
         from: mailOptions.from,
         to: mailOptions.to,
         subject: mailOptions.subject,
         body: mailOptions.html // Store HTML content
     });

     await emailRecord.save(); // Save email data

     return res.status(200).json({ message: 'Successfully mail sended to developer.',status:200});
  

    }catch(err){
        next(err)
    }
  }