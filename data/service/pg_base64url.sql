/*
 * This script will create base64url_encode() and base64url_decode() in the current schema of a postgresql database.
 * Used https://gist.github.com/david-sanabria/0d3ff67eb56d2750502aed4186d6a4a7 as a starting point
 */

CREATE OR REPLACE FUNCTION base64url_encode( data bytea )
RETURNS text
AS $BODY$
/*
 * base64url_encode()
 *
 * This function accepts bytea and turns it into a base64 string
 * that is URI-safe following https://en.wikipedia.org/wiki/Base64#URL_applications
 * minus the last two ==
 *
 */
declare
  key TEXT;
begin

    -- Generate our string bytes and re-encode as a base64 string.
    key := encode(data, 'base64');

    -- Base64 encoding contains 2 URL unsafe characters by default.
    -- The URL-safe version has these replacements.
    key := replace(key, '/', '_'); -- url safe replacement
    key := replace(key, '+', '-'); -- url safe replacement
    key := left(key, -2); -- removes the trailing ==

    return key;

end;$BODY$
LANGUAGE plpgsql
immutable		    /* Makes no changes to data in tables */
returns null ON NULL INPUT  /* Don't bother to call if the value is NULL */
SECURITY INVOKER            /* No reason to use DEFINER for security */
cost 5                      /* A made up number. Any advice? */
;

CREATE OR REPLACE FUNCTION base64url_decode( encoded_text text )
RETURNS bytea
AS $BODY$
/*
 * base64url_decode()
 *
 * This function accepts a string that has been base64 encoded according to https://en.wikipedia.org/wiki/Base64#URL_applications
 * minus the last two ==
 *
 */
declare
    data bytea   := 0;
begin

    -- Base64 encoding contains 2 URL unsafe characters by default.
    -- The URL-safe version has these replacements.
    encoded_text := replace(encoded_text, '_', '/'); -- url safe replacement
    encoded_text := replace(encoded_text, '-', '+'); -- url safe replacement
    encoded_text := encoded_text || '=='; -- adds back the trailing ==

    data = decode(encoded_text, 'base64');
    return data;

end;$BODY$
LANGUAGE plpgsql
immutable		    /* Makes no changes to data in tables */
returns null ON NULL INPUT  /* Don't bother to call if the value is NULL */
SECURITY INVOKER            /* No reason to use DEFINER for security */
cost 5                      /* A made up number. Any advice? */
;

/*
Test :
select base64url_encode(decode('45774962e6f741f6b94072ef63fa1943'::text, 'hex'));
-> RXdJYub3Qfa5QHLvY_oZQw

select encode(base64url_decode('RXdJYub3Qfa5QHLvY_oZQw'),'hex')
-> 45774962e6f741f6b94072ef63fa1943
*/
