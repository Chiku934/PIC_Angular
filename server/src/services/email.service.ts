import * as nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor() {
    this.fromEmail = process.env['EMAIL_FROM'] || 'noreply@piccertificates.com';
    this.fromName = process.env['EMAIL_FROM_NAME'] || 'PIC Certificates';
    
    this.initializeTransporter();
  }

  /**
   * Initialize the email transporter based on configuration
   */
  private initializeTransporter(): void {
    const emailProvider = process.env['EMAIL_PROVIDER'] || 'smtp';

    switch (emailProvider.toLowerCase()) {
      case 'smtp':
        this.initializeSMTPTransporter();
        break;
      case 'gmail':
        this.initializeGmailTransporter();
        break;
      case 'sendgrid':
        this.initializeSendGridTransporter();
        break;
      default:
        this.initializeSMTPTransporter();
        logger.warn(`Unknown email provider: ${emailProvider}, falling back to SMTP`);
    }
  }

  /**
   * Initialize SMTP transporter
   */
  private initializeSMTPTransporter(): void {
    const host = process.env['SMTP_HOST'];
    const port = Number(process.env['SMTP_PORT'] || '587');
    const secure = process.env['SMTP_SECURE'] === 'true';
    const user = process.env['SMTP_USER'];
    const pass = process.env['SMTP_PASS'];

    if (!host || !user || !pass) {
      logger.error('SMTP configuration is incomplete. Email service will not work properly.');
      // Create a test transporter for development
      this.transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        secure: false,
      });
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  /**
   * Initialize Gmail transporter
   */
  private initializeGmailTransporter(): void {
    const clientId = process.env['GMAIL_CLIENT_ID'];
    const clientSecret = process.env['GMAIL_CLIENT_SECRET'];
    const refreshToken = process.env['GMAIL_REFRESH_TOKEN'];

    if (!clientId || !clientSecret || !refreshToken) {
      logger.error('Gmail OAuth2 configuration is incomplete');
      this.initializeSMTPTransporter();
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        clientId,
        clientSecret,
        refreshToken,
      },
    });
  }

  /**
   * Initialize SendGrid transporter
   */
  private initializeSendGridTransporter(): void {
    const apiKey = process.env['SENDGRID_API_KEY'];

    if (!apiKey) {
      logger.error('SendGrid API key is not configured');
      this.initializeSMTPTransporter();
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: apiKey,
      },
    });
  }

  /**
   * Send an email
   */
  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully:', {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send welcome email
   */
  public async sendWelcomeEmail(to: string, username: string): Promise<boolean> {
    const template = this.getWelcomeTemplate(username);
    
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send password reset email
   */
  public async sendPasswordResetEmail(to: string, resetToken: string, username: string): Promise<boolean> {
    const template = this.getPasswordResetTemplate(resetToken, username);
    
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send email verification email
   */
  public async sendEmailVerificationEmail(to: string, verificationToken: string, username: string): Promise<boolean> {
    const template = this.getEmailVerificationTemplate(verificationToken, username);
    
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send OTP email
   */
  public async sendOTPEmail(to: string, otp: string, purpose: 'login' | 'verification' | 'reset'): Promise<boolean> {
    const template = this.getOTPTemplate(otp, purpose);
    
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send certificate issued email
   */
  public async sendCertificateIssuedEmail(to: string, certificateId: string, certificateName: string): Promise<boolean> {
    const template = this.getCertificateIssuedTemplate(certificateId, certificateName);
    
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Get welcome email template
   */
  private getWelcomeTemplate(username: string): EmailTemplate {
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:4200';
    
    return {
      subject: 'Welcome to PIC Certificates',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to PIC Certificates, ${username}!</h2>
          <p>Thank you for registering with PIC Certificates. We're excited to have you on board.</p>
          <p>Your account has been successfully created and you can now:</p>
          <ul>
            <li>Create and manage digital certificates</li>
            <li>Verify certificate authenticity</li>
            <li>Track certificate history</li>
            <li>Download certificate PDFs</li>
          </ul>
          <p>Click the button below to get started:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/login" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Get Started
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you have any questions, please don't hesitate to contact our support team.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `
        Welcome to PIC Certificates, ${username}!
        
        Thank you for registering with PIC Certificates. We're excited to have you on board.
        
        Your account has been successfully created and you can now:
        - Create and manage digital certificates
        - Verify certificate authenticity
        - Track certificate history
        - Download certificate PDFs
        
        Get started here: ${frontendUrl}/login
        
        If you have any questions, please don't hesitate to contact our support team.
        
        This is an automated message. Please do not reply to this email.
      `,
    };
  }

  /**
   * Get password reset email template
   */
  private getPasswordResetTemplate(resetToken: string, username: string): EmailTemplate {
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:4200';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    return {
      subject: 'Reset Your Password - PIC Certificates',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p>Hi ${username},</p>
          <p>We received a request to reset your password for your PIC Certificates account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour for security reasons.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `
        Reset Your Password
        
        Hi ${username},
        
        We received a request to reset your password for your PIC Certificates account.
        
        Click the link below to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
        
        This is an automated message. Please do not reply to this email.
      `,
    };
  }

  /**
   * Get email verification template
   */
  private getEmailVerificationTemplate(verificationToken: string, username: string): EmailTemplate {
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:4200';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
    
    return {
      subject: 'Verify Your Email - PIC Certificates',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify Your Email Address</h2>
          <p>Hi ${username},</p>
          <p>Thank you for registering with PIC Certificates. Please verify your email address to complete your registration.</p>
          <p>Click the button below to verify your email:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 24 hours for security reasons.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you didn't create an account with PIC Certificates, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `
        Verify Your Email Address
        
        Hi ${username},
        
        Thank you for registering with PIC Certificates. Please verify your email address to complete your registration.
        
        Click the link below to verify your email:
        ${verificationUrl}
        
        This link will expire in 24 hours for security reasons.
        
        If you didn't create an account with PIC Certificates, please ignore this email.
        
        This is an automated message. Please do not reply to this email.
      `,
    };
  }

  /**
   * Get OTP email template
   */
  private getOTPTemplate(otp: string, purpose: 'login' | 'verification' | 'reset'): EmailTemplate {
    const purposeText = {
      login: 'sign in to your account',
      verification: 'verify your identity',
      reset: 'reset your password',
    };

    return {
      subject: `Your OTP Code - PIC Certificates`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your One-Time Password (OTP)</h2>
          <p>Use the following OTP to ${purposeText[purpose]}:</p>
          <div style="background-color: #f8f9fa; border: 2px dashed #007bff; padding: 20px; text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 14px;">
            This OTP will expire in 10 minutes for security reasons.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this OTP, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `
        Your One-Time Password (OTP)
        
        Use the following OTP to ${purposeText[purpose]}:
        
        ${otp}
        
        This OTP will expire in 10 minutes for security reasons.
        
        If you didn't request this OTP, please ignore this email.
        
        This is an automated message. Please do not reply to this email.
      `,
    };
  }

  /**
   * Get certificate issued email template
   */
  private getCertificateIssuedTemplate(certificateId: string, certificateName: string): EmailTemplate {
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:4200';
    const certificateUrl = `${frontendUrl}/certificates/${certificateId}`;
    
    return {
      subject: 'Certificate Issued - PIC Certificates',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Certificate Issued Successfully!</h2>
          <p>Congratulations! Your certificate has been issued successfully.</p>
          <div style="background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Certificate Details:</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${certificateName}</p>
            <p style="margin: 5px 0;"><strong>ID:</strong> ${certificateId}</p>
          </div>
          <p>You can now:</p>
          <ul>
            <li>View your certificate online</li>
            <li>Download the PDF version</li>
            <li>Share the verification link</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${certificateUrl}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Certificate
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `
        Certificate Issued Successfully!
        
        Congratulations! Your certificate has been issued successfully.
        
        Certificate Details:
        Name: ${certificateName}
        ID: ${certificateId}
        
        You can now:
        - View your certificate online
        - Download the PDF version
        - Share the verification link
        
        View your certificate here: ${certificateUrl}
        
        This is an automated message. Please do not reply to this email.
      `,
    };
  }

  /**
   * Verify email configuration
   */
  public async verifyConfiguration(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email configuration verified successfully');
      return true;
    } catch (error) {
      logger.error('Email configuration verification failed:', error);
      return false;
    }
  }
}
