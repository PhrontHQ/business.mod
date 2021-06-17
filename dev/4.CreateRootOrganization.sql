
INSERT INTO phront."UserPool" (id, name, "cognitoUserPoolId") VALUES (DEFAULT, 'root-organization-name','us-east-1_O0rNfjutZ' );

INSERT INTO phront."Organization" (id, name, "parent", "creationDate",  "modificationDate", "userPoolIds") VALUES (DEFAULT, 'Company, Inc.',null,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP, '{adb9066e-8b8d-4921-a1eb-16341e833939}');

INSERT INTO phront."Application" (id, name, "controllingOrganizationId") VALUES (DEFAULT, 'plumming-provision', 'b7904148-fd59-4543-a1b0-283a632ca673');

INSERT INTO phront."UserPoolClient" (id, name, "identifier", "credentials",  "cognitoUserPoolId","applicationId") VALUES (DEFAULT, 'plumming-provision','21g5trossecl028nnluql1cgmv','1ud3u5h41l4btspbp7h5d7len8lv4gn3d96iglis5n8m415dostt','us-east-1_vGjTU9wOu', '9901b2e5-2219-4e87-bcc8-2a1e4a35464f');
