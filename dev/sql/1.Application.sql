CREATE TABLE phront."Application"
(
    id uuid NOT NULL DEFAULT phront.gen_random_uuid(),
    name text COLLATE pg_catalog."default",
    "controllingPersonId" uuid,
    "controllingOrganizationId" uuid,
    CONSTRAINT "Application_pkey" PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

CREATE UNIQUE INDEX "Application_id_idx"
    ON phront."Application" USING btree
    (id ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX "Application_name_idx"
    ON phront."Application" USING btree
    (name COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX "Application_controllingPersonId_idx"
    ON phront."Application" USING hash
    ("controllingPersonId")
    TABLESPACE pg_default;

CREATE INDEX "Application_controllingOrganizationId_idx"
    ON phront."Application" USING hash
    ("controllingOrganizationId")
    TABLESPACE pg_default;


/*

Eugenio Martins, D.D.S., P.C. uuid:
19a4daba-199b-4566-8fe2-29722af69a00

*/

INSERT INTO phront."Application" (id, name, "controllingOrganizationId") VALUES (DEFAULT, 'plumming-workstation', '19a4daba-199b-4566-8fe2-29722af69a00');

INSERT INTO phront."Application" (id, name, "controllingOrganizationId") VALUES (DEFAULT, 'plumming-tool', '19a4daba-199b-4566-8fe2-29722af69a00');

INSERT INTO phront."Application" (id, name, "controllingOrganizationId") VALUES (DEFAULT, 'plum-appointments', '19a4daba-199b-4566-8fe2-29722af69a00');
