exports.handler = async (event) => {
    // https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-message.html
    const { userName } = event;
    const { codeParameter } = event.request;

    // this will need to be different for each user application. Perhaps we can
    // write a single sophisticated lambda that can determine the correct URL
    // from the event request information. Or we deploy separate lambdas for
    // each app, preconfigured with the application url.
    const appUrl = 'http://localhost/mod/testApp'; // temp for development

    // Maybe we could let users configure what their confirmation URL looks
    // like. Then again, what's the value in that? Could be simpler to just
    // have a single confirmation URL and let users move on to other concerns.
    const confirmationUrl = `${appUrl}?username=${userName}&confirmationCode=${codeParameter}`;
    // there's additional data we could pass in the url, but username and
    // confirmationCode seems like all we need.

    switch (event.triggerSource) {
        case "CustomMessage_SignUp":
            const link = `<a href="${confirmationUrl}" target="_blank">here</a>`;
            event.response.emailSubject = "Your Etiama verification link";
            event.response.emailMessage = `Thank you for signing up with Etiama. Your confirmation code is <b>${codeParameter}</b><br>Click ${link} here to return to Etiama and activate your account.`;
            // event.response.smsMessage can be set too. Cognito will send
            // the invitation by sms instead of email if the user provides their
            // number when they sign up (and the app in question accepts it and
            // stores it). If we are inviting by sms, sending a url is probably
            // not too useful.
            break;
        case "CustomMessage_AdminCreateUser":
        case "CustomMessage_ResendCode":
        case "CustomMessage_ForgotPassword":
        case "CustomMessage_UpdateUserAttribute":
        case "CustomMessage_VerifyUserAttribute":
        case "CustomMessage_Authentication":
            break;
    }
    return event;
};
