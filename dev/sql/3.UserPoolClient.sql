CREATE TABLE phront."UserPoolClient"
(
    id uuid NOT NULL DEFAULT phront.gen_random_uuid(),
    name text COLLATE pg_catalog."default",
    identifier text COLLATE pg_catalog."default",
    credentials text COLLATE pg_catalog."default",
    "cognitoUserPoolId" text COLLATE pg_catalog."default",
    "applicationId" uuid,
    CONSTRAINT "UserPoolClient_pkey" PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

CREATE UNIQUE INDEX "UserPoolClient_id_idx"
    ON phront."UserPoolClient" USING btree
    (id ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX "UserPoolClient_name_idx"
    ON phront."UserPoolClient" USING btree
    (name COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX "UserPoolClient_identifier_idx"
    ON phront."UserPoolClient" USING btree
    (identifier COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX "UserPoolClient_credentials_idx"
    ON phront."UserPoolClient" USING btree
    (credentials COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX "UserPoolClient_cognitoUserPoolId_idx"
    ON phront."UserPoolClient" USING btree
    ("cognitoUserPoolId" COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX "UserPoolClient_applicationId_idx"
    ON phront."UserPoolClient" USING hash
    ("applicationId")
    TABLESPACE pg_default;

/*

Eugenio Martins, D.D.S., P.C. uuid:
19a4daba-199b-4566-8fe2-29722af69a00

*/

INSERT INTO phront."UserPoolClient" (id, name, "identifier", "credentials",  "cognitoUserPoolId","applicationId") VALUES (DEFAULT, 'plumming-workstation','3bht9ellqo8j90krq0kpklf7mm','881t5di0qtlmap7s6hge6hj4tv45r9heom9o5vugu8u179sv60h','us-east-1_vGjTU9wOu', 'ec0ccb89-e0f5-4fdb-ba24-b566ec557a52');

INSERT INTO phront."UserPoolClient" (id, name, "identifier", "credentials",  "cognitoUserPoolId","applicationId") VALUES (DEFAULT, 'plumming-tool','41g4ufa1d7uv6ln2fasjp35q6','1jaa7s2rk8hjl76mlfdhirjeub9hqn266r145s5tvm98npfsho0u','us-east-1_vGjTU9wOu', 'f20e0119-c8f8-45b5-8118-3d7bfab6c40e');
