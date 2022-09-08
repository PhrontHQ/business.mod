/*
    https://stackoverflow.com/questions/69618632/convert-query-result-to-be-one-array-json-object-in-postgresql
        you can add another layer of json_agg to convert it to a list of json objects.

        e.g.

        SELECT json_agg(row_to_json(r)) my_json_data
        FROM
        (
            select ff.*, json_agg(ffo."option") as options
            from form_field ff, form_field_options ffo
            where ffo.form_field_id = ff.id and ff.form_id = 'fef5c7e0-170c-4556-80d2-42e3db66cfa2'
            group by ff.id
        ) r

    https://stackoverflow.com/questions/39456362/postgres-return-row-data-as-json-array-or-arrays
*/


SELECT json_agg(row_to_json(t)) my_json_data
from (
	SELECT * FROM mod_plum_v1."Questionnaire"
	ORDER BY id ASC
) t
