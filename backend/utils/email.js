const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_HOST_USER,
    pass: process.env.EMAIL_HOST_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"${process.env.PROJECT_NAME}" <${process.env.EMAIL_HOST_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email send error:', err.message);
  }
};

exports.sendVendorApprovedEmail = (vendor) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#f5f5f5;padding:20px;border-radius:12px;">
      <div style="background:#2E7D32;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">🌱 ${process.env.PROJECT_NAME}</h1>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 8px 8px;">
        <h2 style="color:#2E7D32;">Congratulations, ${vendor.name}! 🎉</h2>
        <p style="color:#555;line-height:1.6;">Your vendor account has been <strong style="color:#4CAF50;">approved</strong> by our admin team.</p>
        <p style="color:#555;line-height:1.6;">You can now log in and start listing your farm products on <strong>${process.env.PROJECT_NAME}</strong>.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="http://localhost:3002/login" style="background:#FF9800;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Login to Dashboard</a>
        </div>
        <p style="color:#888;font-size:13px;">Farm: ${vendor.farmName} | Email: ${vendor.email}</p>
      </div>
    </div>
  `;
  return sendEmail({ to: vendor.email, subject: `✅ Account Approved - ${process.env.PROJECT_NAME}`, html });
};

exports.sendVendorRejectedEmail = (vendor, remark) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#f5f5f5;padding:20px;border-radius:12px;">
      <div style="background:#2E7D32;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">🌱 ${process.env.PROJECT_NAME}</h1>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 8px 8px;">
        <h2 style="color:#F44336;">Application Not Approved</h2>
        <p style="color:#555;line-height:1.6;">Dear <strong>${vendor.name}</strong>, we regret to inform you that your vendor application has been <strong style="color:#F44336;">rejected</strong>.</p>
        <div style="background:#FFF3E0;border-left:4px solid #FF9800;padding:16px;border-radius:4px;margin:20px 0;">
          <p style="margin:0;color:#555;"><strong>Reason:</strong> ${remark}</p>
        </div>
        <p style="color:#555;line-height:1.6;">Please address the above issues and re-apply. If you have questions, reply to this email.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: vendor.email, subject: `❌ Application Update - ${process.env.PROJECT_NAME}`, html });
};

exports.sendProductApprovedEmail = (vendor, product) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#f5f5f5;padding:20px;border-radius:12px;">
      <div style="background:#2E7D32;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">🌱 ${process.env.PROJECT_NAME}</h1>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 8px 8px;">
        <h2 style="color:#2E7D32;">Product Approved! 🎉</h2>
        <p style="color:#555;line-height:1.6;">Your product <strong>"${product.name}"</strong> has been approved and is now live on the marketplace.</p>
        <p style="color:#888;font-size:13px;">Price: ₹${product.price} | Stock: ${product.stock} ${product.unit}</p>
      </div>
    </div>
  `;
  return sendEmail({ to: vendor.email, subject: `✅ Product Approved - ${product.name}`, html });
};

exports.sendProductRejectedEmail = (vendor, product, remark) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#f5f5f5;padding:20px;border-radius:12px;">
      <div style="background:#2E7D32;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">🌱 ${process.env.PROJECT_NAME}</h1>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 8px 8px;">
        <h2 style="color:#F44336;">Product Not Approved</h2>
        <p style="color:#555;line-height:1.6;">Your product <strong>"${product.name}"</strong> was not approved.</p>
        <div style="background:#FFF3E0;border-left:4px solid #FF9800;padding:16px;border-radius:4px;margin:20px 0;">
          <p style="margin:0;color:#555;"><strong>Reason:</strong> ${remark}</p>
        </div>
        <p style="color:#555;">Please update the product and resubmit.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: vendor.email, subject: `❌ Product Update - ${product.name}`, html });
};

exports.sendOtpEmail = (email, otp) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#f5f5f5;padding:20px;border-radius:12px;">
      <div style="background:#2E7D32;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">🌱 ${process.env.PROJECT_NAME}</h1>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 8px 8px;text-align:center;">
        <h2 style="color:#333;">Your OTP Code</h2>
        <div style="font-size:48px;font-weight:700;color:#2E7D32;letter-spacing:12px;margin:24px 0;">${otp}</div>
        <p style="color:#888;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: email, subject: `Your OTP - ${process.env.PROJECT_NAME}`, html });
};
