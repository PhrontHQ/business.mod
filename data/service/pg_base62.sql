/*
 * This script will create base62_encode() and base62_decode() in the current schema of a postgresql database.
 * Give it a star if you find it useful.
 */

CREATE OR REPLACE FUNCTION base62_encode( long_number bigint )
RETURNS text
AS $BODY$
/*
 * base62_encode()
 *
 * This function accepts a small or big number (base 10) and reduces its length into a string
 * that is URI-safe using the upper and lower case 26-letter English alphabet
 * as well as the numbers 0 - 9. The result is returned as a text string that can be decoded
 * based to base10 using the base62_decode() function.
 *
 * You can find a handy explainer at https://helloacm.com/base62/
 *
 *
 * HISTORY
 * 2018-03-13 david sanabria, office of systems integration
 *            - New function
 *
 */
declare
    k_base        constant integer := 62;
    k_alphabet    constant text[] := string_to_array( '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'::text, null);

    v_return_text text := '';
    v_remainder   integer;
    v_interim	  bigint;
begin

    v_interim := abs( long_number );  -- Negative Numbers (sign) are ignored

    --Conversion Loop
    loop

        v_remainder     := v_interim % k_base;
	v_interim       := v_interim / k_base;
	v_return_text   := ''|| k_alphabet[ (v_remainder + 1) ] || v_return_text ;

	exit when v_interim <= 0;

    end loop ;


    return v_return_text;

end;$BODY$
LANGUAGE plpgsql
immutable		    /* Makes no changes to data in tables */
returns null ON NULL INPUT  /* Don't bother to call if the value is NULL */
SECURITY INVOKER            /* No reason to use DEFINER for security */
cost 5                      /* A made up number. Any advice? */
;

CREATE OR REPLACE FUNCTION base62_decode( encoded_text text )
RETURNS bigint
AS $BODY$
/*
 * base62_decode()
 *
 * This function accepts a string that has been base62 encoded. Any characters that are not valid
 * are simply ignored, so you can safely pass a formatted string and still get a valid result like you
 * do with a UUID field.
 *
 * HISTORY
 * 2018-03-13 david sanabria, office of systems integration
 *            - New function
 *
 */
declare
    k_base          constant integer := 62;
    k_alphabet      constant text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    v_encoded_arr   text[];
    v_return_result bigint   := 0;
    v_interim	    bigint;
    v_index         integer;  -- Pointer to input array
    v_token         text;
    v_power         integer := 0;  -- reverse pointer, used for position exponent (e.g. 2^32)
begin

    -- check for guard values
    if encoded_text is null or length( encoded_text ) = 0 then
	return null;
    end if;

    -- reverse the input string to make the exponent math simpler below
    v_encoded_arr := string_to_array( reverse( encoded_text ) , null );


    --Conversion Loop
    foreach v_token in array v_encoded_arr
    loop

	v_index := strpos( k_alphabet, v_token );

	if v_index = 0 then
	    raise notice 'Token ignored "%"', v_token;
	    --ignore invalid tokens, which allows formatted strings to be processed (e.g. '{abc-1Lg}')
	else
      v_interim := ( ( v_index - 1) *  pow( k_base, v_power) );
      v_return_result := v_return_result + v_interim;
      v_power := 1 + v_power; --increment after each valid loop
    end if;

    end loop;


    return v_return_result;

end;$BODY$
LANGUAGE plpgsql
immutable		    /* Makes no changes to data in tables */
returns null ON NULL INPUT  /* Don't bother to call if the value is NULL */
SECURITY INVOKER            /* No reason to use DEFINER for security */
cost 5                      /* A made up number. Any advice? */
;

/*
  -- TEST Query
  -- * Requires base62_decode() and base62_encode()
  -- * Tested in PostgreSQL v9.6.7
with arr as (
	select
	62::integer as v_base
	,73::bigint as v_test
	,74400::bigint as v_test2
	,'JM0'::text as v_test2_b
	,09::bigint as v_test3
        ,999888777666::bigint as v_test4
	, string_to_array( '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'::text, null) as v_alphabet
)
select (v_test % v_base)::integer as test_mod
	, (v_test / v_base)::bigint as test_div
	,abs( v_test ) as test_abs
	,v_alphabet[ (v_test % v_base) + 1 ] as test_arr
	,cwsdoc.base62_encode( v_test2 )  as test_encode
	,cwsdoc.base62_encode( null )  as test_encode2
	,cwsdoc.base62_encode( v_test4 )  as test_encode4
	,cwsdoc.base62_decode( cwsdoc.base62_encode( v_test ) ) as test_decode1
	,cwsdoc.base62_decode( cwsdoc.base62_encode( v_test2 ) ) as test_decode2
	,cwsdoc.base62_decode( cwsdoc.base62_encode( v_test3 ) ) as test_decode3
	,cwsdoc.base62_decode( cwsdoc.base62_encode( v_test4 ) ) as test_decode4
	,cwsdoc.base62_decode( null ) as test_decode5
	,cwsdoc.base62_decode( '{JM-0}' ) as test_decode6
	,arr.*
from arr;
*/
