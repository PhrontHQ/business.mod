/*

    This inlines a QuestionnaireQuestion's question own jsonb while using COALESCE() to simulate a logic of choosing among posible different ones, with an inlined select for each, to explore using this for defaults

*/




SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "QuestionnaireQuestion"."id","QuestionnaireQuestion"."publicationDate","QuestionnaireQuestion"."modificationDate","QuestionnaireQuestion"."creationDate","QuestionnaireQuestion"."originId","QuestionnaireQuestion"."possibleAnswerIds","QuestionnaireQuestion"."maximumNumberOfAnswer","QuestionnaireQuestion"."displayLogicExpression",COALESCE("QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,US}', "QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,*}', "QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,*}') as "questionnaireLabel","QuestionnaireQuestion"."questionnairePosition",
										  	COALESCE(
												(SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Question"."id","Question"."publicationDate","Question"."modificationDate","Question"."creationDate","Question"."originId",COALESCE("Question"."notes"::jsonb #>> '{en,US}', "Question"."notes"::jsonb #>> '{en,*}', "Question"."notes"::jsonb #>> '{en,*}') as "notes","Question"."isOpenEnded","Question"."variableIds","Question"."subQuestions","Question"."superQuestionId",COALESCE("Question"."name"::jsonb #>> '{en,US}', "Question"."name"::jsonb #>> '{en,*}', "Question"."name"::jsonb #>> '{en,*}') as "name",COALESCE("Question"."text"::jsonb #>> '{en,US}', "Question"."text"::jsonb #>> '{en,*}', "Question"."text"::jsonb #>> '{en,*}') as "text") as _) FROM phront."Question" WHERE ("Question"."id" = '32e557a5-ba6b-4342-9703-6f69cef7fb29')),
												(SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Question"."id","Question"."publicationDate","Question"."modificationDate","Question"."creationDate","Question"."originId",COALESCE("Question"."notes"::jsonb #>> '{en,US}', "Question"."notes"::jsonb #>> '{en,*}', "Question"."notes"::jsonb #>> '{en,*}') as "notes","Question"."isOpenEnded","Question"."variableIds","Question"."subQuestions","Question"."superQuestionId",COALESCE("Question"."name"::jsonb #>> '{en,US}', "Question"."name"::jsonb #>> '{en,*}', "Question"."name"::jsonb #>> '{en,*}') as "name",COALESCE("Question"."text"::jsonb #>> '{en,US}', "Question"."text"::jsonb #>> '{en,*}', "Question"."text"::jsonb #>> '{en,*}') as "text") as _) FROM phront."Question" WHERE ("Question"."id" = '8bfb4262-f27d-4c41-9ca5-0b335e5ff30b')),
												(SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Question"."id","Question"."publicationDate","Question"."modificationDate","Question"."creationDate","Question"."originId",COALESCE("Question"."notes"::jsonb #>> '{en,US}', "Question"."notes"::jsonb #>> '{en,*}', "Question"."notes"::jsonb #>> '{en,*}') as "notes","Question"."isOpenEnded","Question"."variableIds","Question"."subQuestions","Question"."superQuestionId",COALESCE("Question"."name"::jsonb #>> '{en,US}', "Question"."name"::jsonb #>> '{en,*}', "Question"."name"::jsonb #>> '{en,*}') as "name",COALESCE("Question"."text"::jsonb #>> '{en,US}', "Question"."text"::jsonb #>> '{en,*}', "Question"."text"::jsonb #>> '{en,*}') as "text") as _) FROM phront."Question" WHERE ("Question"."id" = '7c020d99-9579-4f2d-a578-6afed55461c9'))
											)
										  	as "questionId",
										  	"QuestionnaireQuestion"."questionnaireId") as _)
FROM phront."QuestionnaireQuestion" JOIN "phront"."Questionnaire" ON "Questionnaire".id = "QuestionnaireQuestion"."questionnaireId" JOIN "phront"."CustomerEngagementQuestionnaire" ON "Questionnaire".id = "CustomerEngagementQuestionnaire"."questionnaireId" JOIN "phront"."Organization" ON "CustomerEngagementQuestionnaire".id = ANY ("Organization"."customerEngagementQuestionnaireIds") JOIN "phront"."Service" ON "Organization".id = "Service"."vendorId" JOIN "phront"."ServiceProductVariant" ON "ServiceProductVariant".id = ANY ("Service"."variantIds") JOIN "phront"."ServiceEngagement" ON "ServiceProductVariant".id = "ServiceEngagement"."serviceVariantId"
WHERE ("QuestionnaireQuestion"."questionnaireId" = '9da2fa08-73df-438c-b954-4f7007b8563f' AND           ("ServiceEngagement"."originId" = '187cfa9a-c303-4737-a770-17d46e7524a4'))


/*
    With all quesionId condition being valid, the first one is found, it doesn't execute the others:
*/
EXPLAIN ANALYZE  SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "QuestionnaireQuestion"."id","QuestionnaireQuestion"."publicationDate","QuestionnaireQuestion"."modificationDate","QuestionnaireQuestion"."creationDate","QuestionnaireQuestion"."originId","QuestionnaireQuestion"."possibleAnswerIds","QuestionnaireQuestion"."maximumNumberOfAnswer","QuestionnaireQuestion"."displayLogicExpression",COALESCE("QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,US}', "QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,*}', "QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,*}') as "questionnaireLabel","QuestionnaireQuestion"."questionnairePosition",
										  	COALESCE(
												(SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Question"."id","Question"."publicationDate","Question"."modificationDate","Question"."creationDate","Question"."originId",COALESCE("Question"."notes"::jsonb #>> '{en,US}', "Question"."notes"::jsonb #>> '{en,*}', "Question"."notes"::jsonb #>> '{en,*}') as "notes","Question"."isOpenEnded","Question"."variableIds","Question"."subQuestions","Question"."superQuestionId",COALESCE("Question"."name"::jsonb #>> '{en,US}', "Question"."name"::jsonb #>> '{en,*}', "Question"."name"::jsonb #>> '{en,*}') as "name",COALESCE("Question"."text"::jsonb #>> '{en,US}', "Question"."text"::jsonb #>> '{en,*}', "Question"."text"::jsonb #>> '{en,*}') as "text") as _) FROM phront."Question" WHERE ("Question"."id" = '32e557a5-ba6b-4342-9703-6f69cef7fb29')),
												(SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Question"."id","Question"."publicationDate","Question"."modificationDate","Question"."creationDate","Question"."originId",COALESCE("Question"."notes"::jsonb #>> '{en,US}', "Question"."notes"::jsonb #>> '{en,*}', "Question"."notes"::jsonb #>> '{en,*}') as "notes","Question"."isOpenEnded","Question"."variableIds","Question"."subQuestions","Question"."superQuestionId",COALESCE("Question"."name"::jsonb #>> '{en,US}', "Question"."name"::jsonb #>> '{en,*}', "Question"."name"::jsonb #>> '{en,*}') as "name",COALESCE("Question"."text"::jsonb #>> '{en,US}', "Question"."text"::jsonb #>> '{en,*}', "Question"."text"::jsonb #>> '{en,*}') as "text") as _) FROM phront."Question" WHERE ("Question"."id" = '8bfb4262-f27d-4c41-9ca5-0b335e5ff30b')),
												(SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Question"."id","Question"."publicationDate","Question"."modificationDate","Question"."creationDate","Question"."originId",COALESCE("Question"."notes"::jsonb #>> '{en,US}', "Question"."notes"::jsonb #>> '{en,*}', "Question"."notes"::jsonb #>> '{en,*}') as "notes","Question"."isOpenEnded","Question"."variableIds","Question"."subQuestions","Question"."superQuestionId",COALESCE("Question"."name"::jsonb #>> '{en,US}', "Question"."name"::jsonb #>> '{en,*}', "Question"."name"::jsonb #>> '{en,*}') as "name",COALESCE("Question"."text"::jsonb #>> '{en,US}', "Question"."text"::jsonb #>> '{en,*}', "Question"."text"::jsonb #>> '{en,*}') as "text") as _) FROM phront."Question" WHERE ("Question"."id" = '7c020d99-9579-4f2d-a578-6afed55461c9'))
											)
										  	as "questionId",
										  	"QuestionnaireQuestion"."questionnaireId") as _)
FROM phront."QuestionnaireQuestion" JOIN "phront"."Questionnaire" ON "Questionnaire".id = "QuestionnaireQuestion"."questionnaireId" JOIN "phront"."CustomerEngagementQuestionnaire" ON "Questionnaire".id = "CustomerEngagementQuestionnaire"."questionnaireId" JOIN "phront"."Organization" ON "CustomerEngagementQuestionnaire".id = ANY ("Organization"."customerEngagementQuestionnaireIds") JOIN "phront"."Service" ON "Organization".id = "Service"."vendorId" JOIN "phront"."ServiceProductVariant" ON "ServiceProductVariant".id = ANY ("Service"."variantIds") JOIN "phront"."ServiceEngagement" ON "ServiceProductVariant".id = "ServiceEngagement"."serviceVariantId"
WHERE ("QuestionnaireQuestion"."questionnaireId" = '9da2fa08-73df-438c-b954-4f7007b8563f' AND           ("ServiceEngagement"."originId" = '187cfa9a-c303-4737-a770-17d46e7524a4'))

/*
"Unique  (cost=81.13..81.14 rows=1 width=32) (actual time=0.273..0.280 rows=10 loops=1)"
"  ->  Sort  (cost=81.13..81.13 rows=1 width=32) (actual time=0.272..0.276 rows=10 loops=1)"
"        Sort Key: ((SubPlan 7))"
"        Sort Method: quicksort  Memory: 35kB"
"        ->  Nested Loop  (cost=4.45..81.12 rows=1 width=32) (actual time=0.163..0.254 rows=10 loops=1)"
"              ->  Nested Loop  (cost=4.31..48.27 rows=1 width=264) (actual time=0.079..0.094 rows=10 loops=1)"
"                    ->  Nested Loop  (cost=4.31..40.24 rows=1 width=16) (actual time=0.077..0.085 rows=1 loops=1)"
"                          Join Filter: (""CustomerEngagementQuestionnaire"".id = ANY (""Organization"".""customerEngagementQuestionnaireIds""))"
"                          ->  Nested Loop  (cost=0.29..30.58 rows=6 width=32) (actual time=0.066..0.073 rows=1 loops=1)"
"                                ->  Nested Loop  (cost=0.14..27.20 rows=6 width=16) (actual time=0.055..0.062 rows=1 loops=1)"
"                                      Join Filter: (""ServiceProductVariant"".id = ANY (""Service"".""variantIds""))"
"                                      Rows Removed by Join Filter: 21"
"                                      ->  Nested Loop  (cost=0.14..13.30 rows=1 width=16) (actual time=0.044..0.045 rows=1 loops=1)"
"                                            ->  Seq Scan on ""ServiceEngagement""  (cost=0.00..5.03 rows=1 width=16) (actual time=0.033..0.034 rows=1 loops=1)"
"                                                  Filter: (""originId"" = '187cfa9a-c303-4737-a770-17d46e7524a4'::text)"
"                                                  Rows Removed by Filter: 167"
"                                            ->  Index Only Scan using ""ServiceProductVariant_id_idx"" on ""ServiceProductVariant""  (cost=0.14..8.16 rows=1 width=16) (actual time=0.009..0.010 rows=1 loops=1)"
"                                                  Index Cond: (id = ""ServiceEngagement"".""serviceVariantId"")"
"                                                  Heap Fetches: 1"
"                                      ->  Seq Scan on ""Service""  (cost=0.00..11.20 rows=120 width=48) (actual time=0.008..0.011 rows=22 loops=1)"
"                                ->  Index Scan using ""Organization_id_idx"" on ""Organization""  (cost=0.14..0.56 rows=1 width=48) (actual time=0.010..0.010 rows=1 loops=1)"
"                                      Index Cond: (id = ""Service"".""vendorId"")"
"                          ->  Materialize  (cost=4.02..9.37 rows=2 width=32) (actual time=0.009..0.010 rows=1 loops=1)"
"                                ->  Bitmap Heap Scan on ""CustomerEngagementQuestionnaire""  (cost=4.02..9.36 rows=2 width=32) (actual time=0.006..0.007 rows=1 loops=1)"
"                                      Recheck Cond: (""questionnaireId"" = '9da2fa08-73df-438c-b954-4f7007b8563f'::uuid)"
"                                      Heap Blocks: exact=1"
"                                      ->  Bitmap Index Scan on ""CustomerEngagementQuestionnaire_questionnaireId_idx""  (cost=0.00..4.01 rows=2 width=0) (actual time=0.003..0.003 rows=1 loops=1)"
"                                            Index Cond: (""questionnaireId"" = '9da2fa08-73df-438c-b954-4f7007b8563f'::uuid)"
"                    ->  Index Scan using ""QuestionnaireQuestion_questionnaireId_idx"" on ""QuestionnaireQuestion""  (cost=0.00..8.02 rows=1 width=248) (actual time=0.002..0.006 rows=10 loops=1)"
"                          Index Cond: (""questionnaireId"" = '9da2fa08-73df-438c-b954-4f7007b8563f'::uuid)"
"              ->  Index Only Scan using ""Questionnaire_id_idx"" on ""Questionnaire""  (cost=0.15..8.17 rows=1 width=16) (actual time=0.002..0.002 rows=1 loops=10)"
"                    Index Cond: (id = '9da2fa08-73df-438c-b954-4f7007b8563f'::uuid)"
"                    Heap Fetches: 10"
"              SubPlan 7"
"                ->  Result  (cost=24.65..24.67 rows=1 width=32) (actual time=0.013..0.013 rows=1 loops=10)"
"                      InitPlan 2 (returns $12)"
"                        ->  Unique  (cost=8.21..8.22 rows=1 width=32) (actual time=0.056..0.057 rows=1 loops=1)"
"                              ->  Sort  (cost=8.21..8.22 rows=1 width=32) (actual time=0.055..0.055 rows=1 loops=1)"
"                                    Sort Key: ((SubPlan 1))"
"                                    Sort Method: quicksort  Memory: 25kB"
"                                    ->  Index Scan using ""Question_id_idx"" on ""Question""  (cost=0.15..8.20 rows=1 width=32) (actual time=0.031..0.032 rows=1 loops=1)"
"                                          Index Cond: (id = '32e557a5-ba6b-4342-9703-6f69cef7fb29'::uuid)"
"                                          SubPlan 1"
"                                            ->  Result  (cost=0.00..0.03 rows=1 width=32) (actual time=0.020..0.020 rows=1 loops=1)"
"                      InitPlan 4 (returns $25)"
"                        ->  Unique  (cost=8.21..8.22 rows=1 width=32) (never executed)"
"                              ->  Sort  (cost=8.21..8.22 rows=1 width=32) (never executed)"
"                                    Sort Key: ((SubPlan 3))"
"                                    ->  Index Scan using ""Question_id_idx"" on ""Question"" ""Question_1""  (cost=0.15..8.20 rows=1 width=32) (never executed)"
"                                          Index Cond: (id = '8bfb4262-f27d-4c41-9ca5-0b335e5ff30b'::uuid)"
"                                          SubPlan 3"
"                                            ->  Result  (cost=0.00..0.03 rows=1 width=32) (never executed)"
"                      InitPlan 6 (returns $38)"
"                        ->  Unique  (cost=8.21..8.22 rows=1 width=32) (never executed)"
"                              ->  Sort  (cost=8.21..8.22 rows=1 width=32) (never executed)"
"                                    Sort Key: ((SubPlan 5))"
"                                    ->  Index Scan using ""Question_id_idx"" on ""Question"" ""Question_2""  (cost=0.15..8.20 rows=1 width=32) (never executed)"
"                                          Index Cond: (id = '7c020d99-9579-4f2d-a578-6afed55461c9'::uuid)"
"                                          SubPlan 5"
"                                            ->  Result  (cost=0.00..0.03 rows=1 width=32) (never executed)"
"Planning time: 1.215 ms"
"Execution time: 0.473 ms"


/*
If we make the first one invalid, COALESCE executes the second:
*/
EXPLAIN ANALYZE  SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "QuestionnaireQuestion"."id","QuestionnaireQuestion"."publicationDate","QuestionnaireQuestion"."modificationDate","QuestionnaireQuestion"."creationDate","QuestionnaireQuestion"."originId","QuestionnaireQuestion"."possibleAnswerIds","QuestionnaireQuestion"."maximumNumberOfAnswer","QuestionnaireQuestion"."displayLogicExpression",COALESCE("QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,US}', "QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,*}', "QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,*}') as "questionnaireLabel","QuestionnaireQuestion"."questionnairePosition",
										  	COALESCE(
												(SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Question"."id","Question"."publicationDate","Question"."modificationDate","Question"."creationDate","Question"."originId",COALESCE("Question"."notes"::jsonb #>> '{en,US}', "Question"."notes"::jsonb #>> '{en,*}', "Question"."notes"::jsonb #>> '{en,*}') as "notes","Question"."isOpenEnded","Question"."variableIds","Question"."subQuestions","Question"."superQuestionId",COALESCE("Question"."name"::jsonb #>> '{en,US}', "Question"."name"::jsonb #>> '{en,*}', "Question"."name"::jsonb #>> '{en,*}') as "name",COALESCE("Question"."text"::jsonb #>> '{en,US}', "Question"."text"::jsonb #>> '{en,*}', "Question"."text"::jsonb #>> '{en,*}') as "text") as _) FROM phront."Question" WHERE ("Question"."id" = '32e557a5-ba6b-4342-9703-6f69cef7fb28')),
												(SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Question"."id","Question"."publicationDate","Question"."modificationDate","Question"."creationDate","Question"."originId",COALESCE("Question"."notes"::jsonb #>> '{en,US}', "Question"."notes"::jsonb #>> '{en,*}', "Question"."notes"::jsonb #>> '{en,*}') as "notes","Question"."isOpenEnded","Question"."variableIds","Question"."subQuestions","Question"."superQuestionId",COALESCE("Question"."name"::jsonb #>> '{en,US}', "Question"."name"::jsonb #>> '{en,*}', "Question"."name"::jsonb #>> '{en,*}') as "name",COALESCE("Question"."text"::jsonb #>> '{en,US}', "Question"."text"::jsonb #>> '{en,*}', "Question"."text"::jsonb #>> '{en,*}') as "text") as _) FROM phront."Question" WHERE ("Question"."id" = '8bfb4262-f27d-4c41-9ca5-0b335e5ff30b')),
												(SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Question"."id","Question"."publicationDate","Question"."modificationDate","Question"."creationDate","Question"."originId",COALESCE("Question"."notes"::jsonb #>> '{en,US}', "Question"."notes"::jsonb #>> '{en,*}', "Question"."notes"::jsonb #>> '{en,*}') as "notes","Question"."isOpenEnded","Question"."variableIds","Question"."subQuestions","Question"."superQuestionId",COALESCE("Question"."name"::jsonb #>> '{en,US}', "Question"."name"::jsonb #>> '{en,*}', "Question"."name"::jsonb #>> '{en,*}') as "name",COALESCE("Question"."text"::jsonb #>> '{en,US}', "Question"."text"::jsonb #>> '{en,*}', "Question"."text"::jsonb #>> '{en,*}') as "text") as _) FROM phront."Question" WHERE ("Question"."id" = '7c020d99-9579-4f2d-a578-6afed55461c9'))
											)
										  	as "questionId",
										  	"QuestionnaireQuestion"."questionnaireId") as _)
FROM phront."QuestionnaireQuestion" JOIN "phront"."Questionnaire" ON "Questionnaire".id = "QuestionnaireQuestion"."questionnaireId" JOIN "phront"."CustomerEngagementQuestionnaire" ON "Questionnaire".id = "CustomerEngagementQuestionnaire"."questionnaireId" JOIN "phront"."Organization" ON "CustomerEngagementQuestionnaire".id = ANY ("Organization"."customerEngagementQuestionnaireIds") JOIN "phront"."Service" ON "Organization".id = "Service"."vendorId" JOIN "phront"."ServiceProductVariant" ON "ServiceProductVariant".id = ANY ("Service"."variantIds") JOIN "phront"."ServiceEngagement" ON "ServiceProductVariant".id = "ServiceEngagement"."serviceVariantId"
WHERE ("QuestionnaireQuestion"."questionnaireId" = '9da2fa08-73df-438c-b954-4f7007b8563f' AND           ("ServiceEngagement"."originId" = '187cfa9a-c303-4737-a770-17d46e7524a4'))


/*
"Unique  (cost=81.13..81.14 rows=1 width=32) (actual time=0.294..0.302 rows=10 loops=1)"
"  ->  Sort  (cost=81.13..81.13 rows=1 width=32) (actual time=0.293..0.297 rows=10 loops=1)"
"        Sort Key: ((SubPlan 7))"
"        Sort Method: quicksort  Memory: 35kB"
"        ->  Nested Loop  (cost=4.45..81.12 rows=1 width=32) (actual time=0.157..0.276 rows=10 loops=1)"
"              ->  Nested Loop  (cost=4.31..48.27 rows=1 width=264) (actual time=0.084..0.100 rows=10 loops=1)"
"                    ->  Nested Loop  (cost=4.31..40.24 rows=1 width=16) (actual time=0.081..0.090 rows=1 loops=1)"
"                          Join Filter: (""CustomerEngagementQuestionnaire"".id = ANY (""Organization"".""customerEngagementQuestionnaireIds""))"
"                          ->  Nested Loop  (cost=0.29..30.58 rows=6 width=32) (actual time=0.066..0.073 rows=1 loops=1)"
"                                ->  Nested Loop  (cost=0.14..27.20 rows=6 width=16) (actual time=0.055..0.062 rows=1 loops=1)"
"                                      Join Filter: (""ServiceProductVariant"".id = ANY (""Service"".""variantIds""))"
"                                      Rows Removed by Join Filter: 21"
"                                      ->  Nested Loop  (cost=0.14..13.30 rows=1 width=16) (actual time=0.043..0.045 rows=1 loops=1)"
"                                            ->  Seq Scan on ""ServiceEngagement""  (cost=0.00..5.03 rows=1 width=16) (actual time=0.033..0.034 rows=1 loops=1)"
"                                                  Filter: (""originId"" = '187cfa9a-c303-4737-a770-17d46e7524a4'::text)"
"                                                  Rows Removed by Filter: 167"
"                                            ->  Index Only Scan using ""ServiceProductVariant_id_idx"" on ""ServiceProductVariant""  (cost=0.14..8.16 rows=1 width=16) (actual time=0.010..0.010 rows=1 loops=1)"
"                                                  Index Cond: (id = ""ServiceEngagement"".""serviceVariantId"")"
"                                                  Heap Fetches: 1"
"                                      ->  Seq Scan on ""Service""  (cost=0.00..11.20 rows=120 width=48) (actual time=0.007..0.011 rows=22 loops=1)"
"                                ->  Index Scan using ""Organization_id_idx"" on ""Organization""  (cost=0.14..0.56 rows=1 width=48) (actual time=0.010..0.011 rows=1 loops=1)"
"                                      Index Cond: (id = ""Service"".""vendorId"")"
"                          ->  Materialize  (cost=4.02..9.37 rows=2 width=32) (actual time=0.009..0.010 rows=1 loops=1)"
"                                ->  Bitmap Heap Scan on ""CustomerEngagementQuestionnaire""  (cost=4.02..9.36 rows=2 width=32) (actual time=0.006..0.007 rows=1 loops=1)"
"                                      Recheck Cond: (""questionnaireId"" = '9da2fa08-73df-438c-b954-4f7007b8563f'::uuid)"
"                                      Heap Blocks: exact=1"
"                                      ->  Bitmap Index Scan on ""CustomerEngagementQuestionnaire_questionnaireId_idx""  (cost=0.00..4.01 rows=2 width=0) (actual time=0.003..0.003 rows=1 loops=1)"
"                                            Index Cond: (""questionnaireId"" = '9da2fa08-73df-438c-b954-4f7007b8563f'::uuid)"
"                    ->  Index Scan using ""QuestionnaireQuestion_questionnaireId_idx"" on ""QuestionnaireQuestion""  (cost=0.00..8.02 rows=1 width=248) (actual time=0.002..0.007 rows=10 loops=1)"
"                          Index Cond: (""questionnaireId"" = '9da2fa08-73df-438c-b954-4f7007b8563f'::uuid)"
"              ->  Index Only Scan using ""Questionnaire_id_idx"" on ""Questionnaire""  (cost=0.15..8.17 rows=1 width=16) (actual time=0.002..0.002 rows=1 loops=10)"
"                    Index Cond: (id = '9da2fa08-73df-438c-b954-4f7007b8563f'::uuid)"
"                    Heap Fetches: 10"
"              SubPlan 7"
"                ->  Result  (cost=24.65..24.67 rows=1 width=32) (actual time=0.014..0.015 rows=1 loops=10)"
"                      InitPlan 2 (returns $12)"
"                        ->  Unique  (cost=8.21..8.22 rows=1 width=32) (actual time=0.012..0.013 rows=0 loops=1)"
"                              ->  Sort  (cost=8.21..8.22 rows=1 width=32) (actual time=0.012..0.012 rows=0 loops=1)"
"                                    Sort Key: ((SubPlan 1))"
"                                    Sort Method: quicksort  Memory: 25kB"
"                                    ->  Index Scan using ""Question_id_idx"" on ""Question""  (cost=0.15..8.20 rows=1 width=32) (actual time=0.008..0.008 rows=0 loops=1)"
"                                          Index Cond: (id = '32e557a5-ba6b-4342-9703-6f69cef7fb28'::uuid)"
"                                          SubPlan 1"
"                                            ->  Result  (cost=0.00..0.03 rows=1 width=32) (never executed)"
"                      InitPlan 4 (returns $25)"
"                        ->  Unique  (cost=8.21..8.22 rows=1 width=32) (actual time=0.037..0.037 rows=1 loops=1)"
"                              ->  Sort  (cost=8.21..8.22 rows=1 width=32) (actual time=0.037..0.037 rows=1 loops=1)"
"                                    Sort Key: ((SubPlan 3))"
"                                    Sort Method: quicksort  Memory: 25kB"
"                                    ->  Index Scan using ""Question_id_idx"" on ""Question"" ""Question_1""  (cost=0.15..8.20 rows=1 width=32) (actual time=0.029..0.029 rows=1 loops=1)"
"                                          Index Cond: (id = '8bfb4262-f27d-4c41-9ca5-0b335e5ff30b'::uuid)"
"                                          SubPlan 3"
"                                            ->  Result  (cost=0.00..0.03 rows=1 width=32) (actual time=0.020..0.020 rows=1 loops=1)"
"                      InitPlan 6 (returns $38)"
"                        ->  Unique  (cost=8.21..8.22 rows=1 width=32) (never executed)"
"                              ->  Sort  (cost=8.21..8.22 rows=1 width=32) (never executed)"
"                                    Sort Key: ((SubPlan 5))"
"                                    ->  Index Scan using ""Question_id_idx"" on ""Question"" ""Question_2""  (cost=0.15..8.20 rows=1 width=32) (never executed)"
"                                          Index Cond: (id = '7c020d99-9579-4f2d-a578-6afed55461c9'::uuid)"
"                                          SubPlan 5"
"                                            ->  Result  (cost=0.00..0.03 rows=1 width=32) (never executed)"
"Planning time: 1.227 ms"
"Execution time: 0.493 ms"
*/

/*
If we make the second invalid, it executes the 3rd select of the COALESCE:
*/
EXPLAIN ANALYZE  SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "QuestionnaireQuestion"."id","QuestionnaireQuestion"."publicationDate","QuestionnaireQuestion"."modificationDate","QuestionnaireQuestion"."creationDate","QuestionnaireQuestion"."originId","QuestionnaireQuestion"."possibleAnswerIds","QuestionnaireQuestion"."maximumNumberOfAnswer","QuestionnaireQuestion"."displayLogicExpression",COALESCE("QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,US}', "QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,*}', "QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,*}') as "questionnaireLabel","QuestionnaireQuestion"."questionnairePosition",
										  	COALESCE(
												(SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Question"."id","Question"."publicationDate","Question"."modificationDate","Question"."creationDate","Question"."originId",COALESCE("Question"."notes"::jsonb #>> '{en,US}', "Question"."notes"::jsonb #>> '{en,*}', "Question"."notes"::jsonb #>> '{en,*}') as "notes","Question"."isOpenEnded","Question"."variableIds","Question"."subQuestions","Question"."superQuestionId",COALESCE("Question"."name"::jsonb #>> '{en,US}', "Question"."name"::jsonb #>> '{en,*}', "Question"."name"::jsonb #>> '{en,*}') as "name",COALESCE("Question"."text"::jsonb #>> '{en,US}', "Question"."text"::jsonb #>> '{en,*}', "Question"."text"::jsonb #>> '{en,*}') as "text") as _) FROM phront."Question" WHERE ("Question"."id" = '32e557a5-ba6b-4342-9703-6f69cef7fb28')),
												(SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Question"."id","Question"."publicationDate","Question"."modificationDate","Question"."creationDate","Question"."originId",COALESCE("Question"."notes"::jsonb #>> '{en,US}', "Question"."notes"::jsonb #>> '{en,*}', "Question"."notes"::jsonb #>> '{en,*}') as "notes","Question"."isOpenEnded","Question"."variableIds","Question"."subQuestions","Question"."superQuestionId",COALESCE("Question"."name"::jsonb #>> '{en,US}', "Question"."name"::jsonb #>> '{en,*}', "Question"."name"::jsonb #>> '{en,*}') as "name",COALESCE("Question"."text"::jsonb #>> '{en,US}', "Question"."text"::jsonb #>> '{en,*}', "Question"."text"::jsonb #>> '{en,*}') as "text") as _) FROM phront."Question" WHERE ("Question"."id" = '8bfb4262-f27d-4c41-9ca5-0b335e5ff30a')),
												(SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Question"."id","Question"."publicationDate","Question"."modificationDate","Question"."creationDate","Question"."originId",COALESCE("Question"."notes"::jsonb #>> '{en,US}', "Question"."notes"::jsonb #>> '{en,*}', "Question"."notes"::jsonb #>> '{en,*}') as "notes","Question"."isOpenEnded","Question"."variableIds","Question"."subQuestions","Question"."superQuestionId",COALESCE("Question"."name"::jsonb #>> '{en,US}', "Question"."name"::jsonb #>> '{en,*}', "Question"."name"::jsonb #>> '{en,*}') as "name",COALESCE("Question"."text"::jsonb #>> '{en,US}', "Question"."text"::jsonb #>> '{en,*}', "Question"."text"::jsonb #>> '{en,*}') as "text") as _) FROM phront."Question" WHERE ("Question"."id" = '7c020d99-9579-4f2d-a578-6afed55461c9'))
											)
										  	as "questionId",
										  	"QuestionnaireQuestion"."questionnaireId") as _)
FROM phront."QuestionnaireQuestion" JOIN "phront"."Questionnaire" ON "Questionnaire".id = "QuestionnaireQuestion"."questionnaireId" JOIN "phront"."CustomerEngagementQuestionnaire" ON "Questionnaire".id = "CustomerEngagementQuestionnaire"."questionnaireId" JOIN "phront"."Organization" ON "CustomerEngagementQuestionnaire".id = ANY ("Organization"."customerEngagementQuestionnaireIds") JOIN "phront"."Service" ON "Organization".id = "Service"."vendorId" JOIN "phront"."ServiceProductVariant" ON "ServiceProductVariant".id = ANY ("Service"."variantIds") JOIN "phront"."ServiceEngagement" ON "ServiceProductVariant".id = "ServiceEngagement"."serviceVariantId"
WHERE ("QuestionnaireQuestion"."questionnaireId" = '9da2fa08-73df-438c-b954-4f7007b8563f' AND           ("ServiceEngagement"."originId" = '187cfa9a-c303-4737-a770-17d46e7524a4'))


/*
"Unique  (cost=81.13..81.14 rows=1 width=32) (actual time=0.377..0.388 rows=10 loops=1)"
"  ->  Sort  (cost=81.13..81.13 rows=1 width=32) (actual time=0.377..0.382 rows=10 loops=1)"
"        Sort Key: ((SubPlan 7))"
"        Sort Method: quicksort  Memory: 35kB"
"        ->  Nested Loop  (cost=4.45..81.12 rows=1 width=32) (actual time=0.210..0.354 rows=10 loops=1)"
"              ->  Nested Loop  (cost=4.31..48.27 rows=1 width=264) (actual time=0.107..0.129 rows=10 loops=1)"
"                    ->  Nested Loop  (cost=4.31..40.24 rows=1 width=16) (actual time=0.103..0.116 rows=1 loops=1)"
"                          Join Filter: (""CustomerEngagementQuestionnaire"".id = ANY (""Organization"".""customerEngagementQuestionnaireIds""))"
"                          ->  Nested Loop  (cost=0.29..30.58 rows=6 width=32) (actual time=0.089..0.100 rows=1 loops=1)"
"                                ->  Nested Loop  (cost=0.14..27.20 rows=6 width=16) (actual time=0.076..0.086 rows=1 loops=1)"
"                                      Join Filter: (""ServiceProductVariant"".id = ANY (""Service"".""variantIds""))"
"                                      Rows Removed by Join Filter: 21"
"                                      ->  Nested Loop  (cost=0.14..13.30 rows=1 width=16) (actual time=0.058..0.060 rows=1 loops=1)"
"                                            ->  Seq Scan on ""ServiceEngagement""  (cost=0.00..5.03 rows=1 width=16) (actual time=0.043..0.045 rows=1 loops=1)"
"                                                  Filter: (""originId"" = '187cfa9a-c303-4737-a770-17d46e7524a4'::text)"
"                                                  Rows Removed by Filter: 167"
"                                            ->  Index Only Scan using ""ServiceProductVariant_id_idx"" on ""ServiceProductVariant""  (cost=0.14..8.16 rows=1 width=16) (actual time=0.013..0.013 rows=1 loops=1)"
"                                                  Index Cond: (id = ""ServiceEngagement"".""serviceVariantId"")"
"                                                  Heap Fetches: 1"
"                                      ->  Seq Scan on ""Service""  (cost=0.00..11.20 rows=120 width=48) (actual time=0.013..0.018 rows=22 loops=1)"
"                                ->  Index Scan using ""Organization_id_idx"" on ""Organization""  (cost=0.14..0.56 rows=1 width=48) (actual time=0.012..0.012 rows=1 loops=1)"
"                                      Index Cond: (id = ""Service"".""vendorId"")"
"                          ->  Materialize  (cost=4.02..9.37 rows=2 width=32) (actual time=0.011..0.013 rows=1 loops=1)"
"                                ->  Bitmap Heap Scan on ""CustomerEngagementQuestionnaire""  (cost=4.02..9.36 rows=2 width=32) (actual time=0.007..0.008 rows=1 loops=1)"
"                                      Recheck Cond: (""questionnaireId"" = '9da2fa08-73df-438c-b954-4f7007b8563f'::uuid)"
"                                      Heap Blocks: exact=1"
"                                      ->  Bitmap Index Scan on ""CustomerEngagementQuestionnaire_questionnaireId_idx""  (cost=0.00..4.01 rows=2 width=0) (actual time=0.004..0.004 rows=1 loops=1)"
"                                            Index Cond: (""questionnaireId"" = '9da2fa08-73df-438c-b954-4f7007b8563f'::uuid)"
"                    ->  Index Scan using ""QuestionnaireQuestion_questionnaireId_idx"" on ""QuestionnaireQuestion""  (cost=0.00..8.02 rows=1 width=248) (actual time=0.003..0.009 rows=10 loops=1)"
"                          Index Cond: (""questionnaireId"" = '9da2fa08-73df-438c-b954-4f7007b8563f'::uuid)"
"              ->  Index Only Scan using ""Questionnaire_id_idx"" on ""Questionnaire""  (cost=0.15..8.17 rows=1 width=16) (actual time=0.002..0.002 rows=1 loops=10)"
"                    Index Cond: (id = '9da2fa08-73df-438c-b954-4f7007b8563f'::uuid)"
"                    Heap Fetches: 10"
"              SubPlan 7"
"                ->  Result  (cost=24.65..24.67 rows=1 width=32) (actual time=0.018..0.018 rows=1 loops=10)"
"                      InitPlan 2 (returns $12)"
"                        ->  Unique  (cost=8.21..8.22 rows=1 width=32) (actual time=0.015..0.016 rows=0 loops=1)"
"                              ->  Sort  (cost=8.21..8.22 rows=1 width=32) (actual time=0.015..0.015 rows=0 loops=1)"
"                                    Sort Key: ((SubPlan 1))"
"                                    Sort Method: quicksort  Memory: 25kB"
"                                    ->  Index Scan using ""Question_id_idx"" on ""Question""  (cost=0.15..8.20 rows=1 width=32) (actual time=0.010..0.010 rows=0 loops=1)"
"                                          Index Cond: (id = '32e557a5-ba6b-4342-9703-6f69cef7fb28'::uuid)"
"                                          SubPlan 1"
"                                            ->  Result  (cost=0.00..0.03 rows=1 width=32) (never executed)"
"                      InitPlan 4 (returns $25)"
"                        ->  Unique  (cost=8.21..8.22 rows=1 width=32) (actual time=0.009..0.010 rows=0 loops=1)"
"                              ->  Sort  (cost=8.21..8.22 rows=1 width=32) (actual time=0.009..0.010 rows=0 loops=1)"
"                                    Sort Key: ((SubPlan 3))"
"                                    Sort Method: quicksort  Memory: 25kB"
"                                    ->  Index Scan using ""Question_id_idx"" on ""Question"" ""Question_1""  (cost=0.15..8.20 rows=1 width=32) (actual time=0.006..0.006 rows=0 loops=1)"
"                                          Index Cond: (id = '8bfb4262-f27d-4c41-9ca5-0b335e5ff30a'::uuid)"
"                                          SubPlan 3"
"                                            ->  Result  (cost=0.00..0.03 rows=1 width=32) (never executed)"
"                      InitPlan 6 (returns $38)"
"                        ->  Unique  (cost=8.21..8.22 rows=1 width=32) (actual time=0.047..0.048 rows=1 loops=1)"
"                              ->  Sort  (cost=8.21..8.22 rows=1 width=32) (actual time=0.047..0.048 rows=1 loops=1)"
"                                    Sort Key: ((SubPlan 5))"
"                                    Sort Method: quicksort  Memory: 25kB"
"                                    ->  Index Scan using ""Question_id_idx"" on ""Question"" ""Question_2""  (cost=0.15..8.20 rows=1 width=32) (actual time=0.037..0.038 rows=1 loops=1)"
"                                          Index Cond: (id = '7c020d99-9579-4f2d-a578-6afed55461c9'::uuid)"
"                                          SubPlan 5"
"                                            ->  Result  (cost=0.00..0.03 rows=1 width=32) (actual time=0.025..0.025 rows=1 loops=1)"
"Planning time: 4.726 ms"
"Execution time: 0.658 ms"
*/
