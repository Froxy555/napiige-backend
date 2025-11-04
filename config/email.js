const nodemailer = require('nodemailer');

// Email transporter létrehozása
const createTransporter = () => {
  // Gmail SMTP használata - helyettesítsd a saját email szolgáltatóddal
  return nodemailer.createTransport({
    service: 'gmail', // vagy 'outlook', 'yahoo', stb.
    auth: {
      user: process.env.EMAIL_USER, // pl. 'te@gmail.com'
      pass: process.env.EMAIL_PASSWORD // App Password (nem a sima jelszó!)
    }
  });
};

// Email küldése
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.APP_NAME || 'Igeszakasz App'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email elküldve:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email küldési hiba:', error);
    return { success: false, error: error.message };
  }
};

// Email template-ek
const emailTemplates = {
  // Új reflexió értesítés
  newReflection: (userName, reflectionText, groupName) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .reflection { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
        .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🙏 Új Reflexió</h1>
        </div>
        <div class="content">
          <p>Üdv!</p>
          <p><strong>${userName}</strong> új reflexiót írt${groupName ? ` a <strong>${groupName}</strong> csoportban` : ''}:</p>
          <div class="reflection">
            <p>${reflectionText}</p>
          </div>
          <a href="${process.env.APP_URL || 'http://localhost:3000'}" class="btn">Megnézem az alkalmazásban</a>
        </div>
        <div class="footer">
          <p>Ez egy automatikus értesítés az Igeszakasz alkalmazásból.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Új csoportüzenet értesítés
  newGroupMessage: (userName, messageText, groupName) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .message { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
        .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💬 Új Üzenet</h1>
        </div>
        <div class="content">
          <p>Üdv!</p>
          <p><strong>${userName}</strong> új üzenetet írt a <strong>${groupName}</strong> csoportban:</p>
          <div class="message">
            <p>${messageText}</p>
          </div>
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/groups" class="btn">Válaszolok</a>
        </div>
        <div class="footer">
          <p>Ez egy automatikus értesítés az Igeszakasz alkalmazásból.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Új felvétel értesítés
  newRecording: (userName, recordingTitle, recordingDate) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .recording { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
        .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎙️ Új Felvétel</h1>
        </div>
        <div class="content">
          <p>Üdv!</p>
          <p><strong>${userName}</strong> új felvételt töltött fel:</p>
          <div class="recording">
            <h3>${recordingTitle}</h3>
            <p>📅 Dátum: ${recordingDate}</p>
          </div>
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/recordings" class="btn">Meghallgatom</a>
        </div>
        <div class="footer">
          <p>Ez egy automatikus értesítés az Igeszakasz alkalmazásból.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Napi reflexió emlékeztető
  dailyReflectionReminder: (userName, todayDate) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; text-align: center; }
        .icon { font-size: 64px; margin: 20px 0; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
        .btn { display: inline-block; padding: 14px 32px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600; }
        .quote { font-style: italic; color: #666; margin: 20px 0; padding: 15px; background: white; border-left: 4px solid #667eea; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✍️ Napi Emlékeztető</h1>
        </div>
        <div class="content">
          <div class="icon">🙏</div>
          <p>Szia <strong>${userName}</strong>!</p>
          <p>Ma még nem írtál lelki üzenetet.</p>
          <div class="quote">
            <p>"Örvendezve jöjjetek színe elé, ujjongjatok!"</p>
            <p><small>- Zsoltárok 100:2</small></p>
          </div>
          <p>Szánj pár percet arra, hogy megoszd gondolataidat a mai igeszakaszról! 📖</p>
          <p><small>📅 ${todayDate}</small></p>
          <a href="${process.env.APP_URL || 'http://localhost:3000'}" class="btn">Reflexió írása</a>
        </div>
        <div class="footer">
          <p>Ez egy automatikus emlékeztető az Igeszakasz alkalmazásból.</p>
          <p>Ha nem szeretnél ilyen értesítéseket kapni, jelezd az adminisztrátornak.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Csoporthoz meghívás
  groupInvitation: (inviterName, groupName) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; text-align: center; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
        .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Meghívás Csoportba</h1>
        </div>
        <div class="content">
          <p>Üdv!</p>
          <p><strong>${inviterName}</strong> meghívott téged a <strong>${groupName}</strong> csoportba!</p>
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/groups" class="btn">Elfogadom a meghívást</a>
        </div>
        <div class="footer">
          <p>Ez egy automatikus értesítés az Igeszakasz alkalmazásból.</p>
        </div>
      </div>
    </body>
    </html>
  `
};

module.exports = {
  sendEmail,
  emailTemplates
};
