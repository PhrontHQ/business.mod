ALTER TABLE phront."Organization"
ADD COLUMN "userPoolIds" uuid[];

CREATE INDEX "Organization_userPoolIds_idx"
    ON phront."Organization" USING gin
    ("userPoolIds")
    TABLESPACE pg_default;


CREATE TABLE phront."UserPool"
(
    id uuid NOT NULL DEFAULT phront.gen_random_uuid(),
    name text COLLATE pg_catalog."default",
    "cognitoUserPoolId" text COLLATE pg_catalog."default",
    CONSTRAINT "UserPool_pkey" PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

CREATE UNIQUE INDEX "UserPool_id_idx"
    ON phront."UserPool" USING btree
    (id ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX "UserPool_name_idx"
    ON phront."UserPool" USING btree
    (name COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX "UserPool_cognitoUserPoolId_idx"
    ON phront."UserPool" USING btree
    ("cognitoUserPoolId" COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;


INSERT INTO phront."UserPool" (id, name, "cognitoUserPoolId") VALUES (DEFAULT, 'plum-appointments-staging-1','us-east-1_vGjTU9wOu' );


/*
    Set creted UserPool id in Organization's userPoolIds
*/
