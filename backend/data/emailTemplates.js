const emailTemplates = [
  {
    id: 'business-announcement',
    name: 'Business Announcement',
    category: 'business',
    subject: 'Important Announcement from {{companyName}}',
    body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Important Announcement</h1>
        </div>
        <div class="content">
            <p>Dear {{recipientName}},</p>
            <p>We're excited to share some important news with you about {{companyName}}.</p>
            <p>{{announcementContent}}</p>
            <p>We appreciate your continued support and look forward to sharing more updates soon.</p>
            <br>
            <p>Best regards,<br>{{senderName}}<br>{{senderTitle}}</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 {{companyName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
    variables: ['recipientName', 'companyName', 'announcementContent', 'senderName', 'senderTitle']
  },
  {
    id: 'newsletter-basic',
    name: 'Monthly Newsletter',
    category: 'newsletter',
    subject: '{{month}} Newsletter - Latest Updates from {{companyName}}',
    body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; }
        .newsletter-section { margin-bottom: 25px; padding-bottom: 25px; border-bottom: 1px solid #e9ecef; }
        .newsletter-section:last-child { border-bottom: none; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .cta-button { background: #4facfe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{month}} Newsletter</h1>
            <p>Stay updated with the latest from {{companyName}}</p>
        </div>
        <div class="content">
            <p>Hello {{recipientName}},</p>
            
            <div class="newsletter-section">
                <h3>📰 Featured News</h3>
                <p>{{featuredNews}}</p>
            </div>
            
            <div class="newsletter-section">
                <h3>🎯 This Month's Highlights</h3>
                <p>{{monthHighlights}}</p>
            </div>
            
            <div class="newsletter-section">
                <h3>📅 Upcoming Events</h3>
                <p>{{upcomingEvents}}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ctaLink}}" class="cta-button">Learn More</a>
            </div>
            
            <p>Thank you for being part of our community!</p>
            <br>
            <p>Warm regards,<br>The {{companyName}} Team</p>
        </div>
        <div class="footer">
            <p>You're receiving this email because you subscribed to our newsletter.<br>
            <a href="{{unsubscribeLink}}">Unsubscribe</a> | <a href="{{preferencesLink}}">Update Preferences</a></p>
        </div>
    </div>
</body>
</html>`,
    variables: ['recipientName', 'companyName', 'month', 'featuredNews', 'monthHighlights', 'upcomingEvents', 'ctaLink', 'unsubscribeLink', 'preferencesLink']
  },
  {
    id: 'promotional-offer',
    name: 'Special Promotion',
    category: 'promotional',
    subject: '🎁 Special Offer Just For You! {{discountAmount}} Off',
    body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b6b, #ffa726); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; }
        .offer-banner { background: #fff3e0; border: 2px dashed #ffa726; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .claim-button { background: #ff6b6b; color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px; }
        .countdown { background: #333; color: white; padding: 10px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Special Promotion!</h1>
            <p>Don't miss this exclusive offer</p>
        </div>
        <div class="content">
            <p>Hi {{recipientName}},</p>
            
            <p>As a valued customer, we're excited to offer you an exclusive discount:</p>
            
            <div class="offer-banner">
                <h2 style="color: #ff6b6b; margin: 0;">{{discountAmount}} OFF</h2>
                <h3 style="margin: 10px 0;">{{offerDescription}}</h3>
                <p style="margin: 0;">Use code: <strong style="font-size: 18px;">{{promoCode}}</strong></p>
            </div>
            
            <div class="countdown">
                <p style="margin: 0;">⏰ Offer expires: {{expiryDate}}</p>
            </div>
            
            <p>{{promotionDetails}}</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{claimLink}}" class="claim-button">Claim Your Offer Now</a>
            </div>
            
            <p>This is a limited-time offer, so don't wait!</p>
            <br>
            <p>Best regards,<br>The {{companyName}} Team</p>
        </div>
        <div class="footer">
            <p>This offer is exclusively for you. Not interested? <a href="{{unsubscribeLink}}">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>`,
    variables: ['recipientName', 'companyName', 'discountAmount', 'offerDescription', 'promoCode', 'expiryDate', 'promotionDetails', 'claimLink', 'unsubscribeLink']
  },
  {
    id: 'personal-invitation',
    name: 'Personal Invitation',
    category: 'personal',
    subject: "You're Invited! {{eventName}}",
    body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .rsvp-button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>You're Invited!</h1>
            <p>We'd be delighted by your presence</p>
        </div>
        <div class="content">
            <p>Dear {{recipientName}},</p>
            
            <p>It is with great pleasure that we invite you to:</p>
            
            <div class="event-details">
                <h2 style="color: #667eea; margin-top: 0;">{{eventName}}</h2>
                <p><strong>📅 Date:</strong> {{eventDate}}</p>
                <p><strong>⏰ Time:</strong> {{eventTime}}</p>
                <p><strong>📍 Location:</strong> {{eventLocation}}</p>
                <p><strong>👔 Dress Code:</strong> {{dressCode}}</p>
            </div>
            
            <p>{{eventDescription}}</p>
            
            <p>We truly hope you can join us for this special occasion.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{rsvpLink}}" class="rsvp-button">RSVP Now</a>
            </div>
            
            <p>Looking forward to seeing you!</p>
            <br>
            <p>Warm regards,<br>{{hostName}}</p>
        </div>
        <div class="footer">
            <p>Please respond by {{rsvpDeadline}}</p>
        </div>
    </div>
</body>
</html>`,
    variables: ['recipientName', 'eventName', 'eventDate', 'eventTime', 'eventLocation', 'dressCode', 'eventDescription', 'hostName', 'rsvpLink', 'rsvpDeadline']
  },
  {
    id: 'system-notification',
    name: 'System Notification',
    category: 'notification',
    subject: 'Notification: {{notificationTitle}}',
    body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #495057, #6c757d); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; }
        .notification-box { background: #e7f1ff; border: 1px solid #b3d4ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .action-button { background: #495057; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>System Notification</h1>
        </div>
        <div class="content">
            <p>Hello {{recipientName}},</p>
            
            <div class="notification-box">
                <h3 style="margin-top: 0; color: #495057;">{{notificationTitle}}</h3>
                <p style="margin-bottom: 0;">{{notificationMessage}}</p>
            </div>
            
            <p>{{additionalDetails}}</p>
            
            {{#if requiresAction}}
            <div style="text-align: center; margin: 25px 0;">
                <a href="{{actionLink}}" class="action-button">Take Action</a>
            </div>
            {{/if}}
            
            <p>If you have any questions, please contact our support team.</p>
            <br>
            <p>Thank you,<br>{{systemName}} Team</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`,
    variables: ['recipientName', 'notificationTitle', 'notificationMessage', 'additionalDetails', 'requiresAction', 'actionLink', 'systemName']
  }
];

module.exports = emailTemplates;