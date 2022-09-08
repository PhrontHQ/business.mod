SELECT json_build_object(
	'QuestionnaireQuestion', json_agg(
		DISTINCT (SELECT to_jsonb(_) FROM (SELECT "QuestionnaireQuestion"."id","QuestionnaireQuestion"."questionnaireId","QuestionnaireQuestion"."questionId","QuestionnaireQuestion"."questionnairePosition",COALESCE("QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,US}', "QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,*}', "QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,*}') as "questionnaireLabel","QuestionnaireQuestion"."displayLogicExpression","QuestionnaireQuestion"."maximumNumberOfAnswer","QuestionnaireQuestion"."possibleAnswerIds","QuestionnaireQuestion"."originId","QuestionnaireQuestion"."isTemplate",COALESCE("QuestionnaireQuestion"."templateName"::jsonb #>> '{en,US}', "QuestionnaireQuestion"."templateName"::jsonb #>> '{en,*}', "QuestionnaireQuestion"."templateName"::jsonb #>> '{en,*}') as "templateName",COALESCE("QuestionnaireQuestion"."templateDescription"::jsonb #>> '{en,US}', "QuestionnaireQuestion"."templateDescription"::jsonb #>> '{en,*}', "QuestionnaireQuestion"."templateDescription"::jsonb #>> '{en,*}') as "templateDescription","QuestionnaireQuestion"."creationDate","QuestionnaireQuestion"."modificationDate","QuestionnaireQuestion"."publicationDate") as _)
	),
	'Questionnaire', json_agg(
		DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Questionnaire".id) as _)
	),
	'CustomerEngagementQuestionnaire', json_agg(
		DISTINCT (SELECT to_jsonb(_) FROM (SELECT "CustomerEngagementQuestionnaire".id, "CustomerEngagementQuestionnaire"."questionnaireId", "CustomerEngagementQuestionnaire"."organizationId") as _)
	),
	'Organization', json_agg(
		DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Organization".id) as _)
	),
	'Service', json_agg(
		DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Service".id, "Service"."vendorId", "Service"."variantIds") as _)
	),
	'ServiceProductVariant', json_agg(
		DISTINCT (SELECT to_jsonb(_) FROM (SELECT "ServiceProductVariant".id) as _)
	),
	'ServiceEngagement', json_agg(
		DISTINCT (SELECT to_jsonb(_) FROM (SELECT "ServiceEngagement".id, "ServiceEngagement"."serviceVariantId", "ServiceEngagement"."originId") as _)
	)
) as result
FROM phront."QuestionnaireQuestion"
JOIN "phront"."Questionnaire" ON "Questionnaire".id = "QuestionnaireQuestion"."questionnaireId"
JOIN "phront"."CustomerEngagementQuestionnaire" ON "Questionnaire".id = "CustomerEngagementQuestionnaire"."questionnaireId"
JOIN "phront"."Organization" ON "Organization".id = "CustomerEngagementQuestionnaire"."organizationId"
JOIN "phront"."Service" ON "Organization".id = "Service"."vendorId"
JOIN "phront"."ServiceProductVariant" ON "ServiceProductVariant".id = ANY ("Service"."variantIds")
JOIN "phront"."ServiceEngagement" ON "ServiceProductVariant".id = "ServiceEngagement"."serviceVariantId"

WHERE (
	"QuestionnaireQuestion"."questionnaireId" = 'de6e13ef-edb4-453a-a98a-9312a483437c'
	AND
	"ServiceEngagement"."originId" = 'cd06ccf3-f250-4d29-9901-62bef6de54f8'
