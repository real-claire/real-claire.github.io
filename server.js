const {google} = require('googleapis');

exports.handler = async (event, context) => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        `${process.env.URL}/.netlify/functions/callback` // Adjust this for Vercel or local development
    );

    const {tokens} = await oauth2Client.getToken(event.queryStringParameters.code);
    oauth2Client.setCredentials(tokens);

    const drive = google.drive({version: 'v3', auth: oauth2Client});
    const response = await drive.files.list({
        q: "mimeType='audio/mpeg'",
        fields: 'files(id, name)',
        spaces: 'drive',
    });

    return {
        statusCode: 200,
        body: JSON.stringify(response.data.files)
    };
};
