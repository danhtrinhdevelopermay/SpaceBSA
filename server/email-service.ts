import nodemailer from 'nodemailer';
import { User } from '@shared/schema';

export class EmailService {
  private transporter!: nodemailer.Transporter;
  private isConfigured: boolean = false;

  constructor() {
    this.setupTransporter();
  }

  private setupTransporter() {
    // Check for email configuration
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const emailService = process.env.EMAIL_SERVICE || 'gmail';

    if (!emailUser || !emailPassword) {
      console.log('[EmailService] Email credentials not configured, email notifications disabled');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: emailUser,
          pass: emailPassword
        }
      });

      this.isConfigured = true;
      console.log('[EmailService] Email service configured successfully');
    } catch (error) {
      console.error('[EmailService] Failed to configure email service:', error);
      this.isConfigured = false;
    }
  }

  async sendShareNotification(
    recipientEmail: string,
    senderUser: User,
    fileName: string,
    shareToken: string,
    permission: string
  ): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('[EmailService] Email not configured, skipping notification');
      return false;
    }

    const shareLink = `${process.env.APP_URL || 'http://localhost:5000'}/share/${shareToken}`;
    const permissionText = this.getPermissionText(permission);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `${senderUser.displayName} đã chia sẻ file "${fileName}" với bạn`,
      html: this.generateShareEmailTemplate(
        senderUser.displayName,
        fileName,
        shareLink,
        permissionText
      )
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] Share notification sent to ${recipientEmail}`);
      return true;
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error);
      return false;
    }
  }

  private getPermissionText(permission: string): string {
    switch (permission) {
      case 'view': return 'có thể xem';
      case 'edit': return 'có thể chỉnh sửa';
      case 'download': return 'có thể tải xuống';
      default: return permission;
    }
  }

  private generateShareEmailTemplate(
    senderName: string,
    fileName: string,
    shareLink: string,
    permission: string
  ): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File được chia sẻ</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .email-container {
            background: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 32px;
        }
        .logo {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #8b5cf6, #ec4899);
            border-radius: 50%;
            margin: 0 auto 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        .title {
            color: #1f2937;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
        }
        .content {
            margin-bottom: 32px;
        }
        .file-info {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .file-name {
            font-weight: 600;
            color: #1f2937;
            font-size: 16px;
        }
        .permission {
            color: #6b7280;
            font-size: 14px;
            margin-top: 4px;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #8b5cf6, #ec4899);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            margin-top: 32px;
        }
        .security-note {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 12px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">S</div>
            <h1 class="title">File được chia sẻ</h1>
        </div>
        
        <div class="content">
            <p>Xin chào,</p>
            <p><strong>${senderName}</strong> đã chia sẻ một file với bạn trên SpaceBSA.</p>
            
            <div class="file-info">
                <div class="file-name">📄 ${fileName}</div>
                <div class="permission">Quyền truy cập: ${permission}</div>
            </div>
            
            <div style="text-align: center;">
                <a href="${shareLink}" class="btn">Mở file</a>
            </div>
            
            <div class="security-note">
                <strong>Lưu ý bảo mật:</strong> Liên kết này chỉ dành cho bạn. Không chia sẻ với người khác để đảm bảo an toàn.
            </div>
            
            <p>Nếu bạn gặp vấn đề gì khi truy cập file, vui lòng liên hệ với người gửi hoặc hỗ trợ kỹ thuật.</p>
        </div>
        
        <div class="footer">
            <p>Email này được gửi từ <strong>SpaceBSA</strong> - Nền tảng chia sẻ file an toàn</p>
            <p>Nếu bạn không mong muốn nhận email này, vui lòng bỏ qua.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  isEmailEnabled(): boolean {
    return this.isConfigured;
  }
}

export const emailService = new EmailService();