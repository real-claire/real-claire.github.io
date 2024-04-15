const {google} = require('googleapis');

module.exports = (req, res) => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        `${process.env.VERCEL_URL}/api/callback`
    );

    const scopes = [
        'https://www.googleapis.com/auth/drive.readonly'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes
    });

    res.redirect(url);
};
