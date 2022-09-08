SELECT json_build_object(
	'a',(
		SELECT jsonb_agg(row_to_json(r)) a
		from (
			SELECT DISTINCT "QuestionnaireQuestion"."id","QuestionnaireQuestion"."questionnaireId","QuestionnaireQuestion"."questionId","QuestionnaireQuestion"."questionnairePosition",COALESCE("QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,US}', "QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,*}') as "questionnaireLabel","QuestionnaireQuestion"."displayLogicExpression","QuestionnaireQuestion"."maximumNumberOfAnswer","QuestionnaireQuestion"."possibleAnswerIds","QuestionnaireQuestion"."originId","QuestionnaireQuestion"."isTemplate",COALESCE("QuestionnaireQuestion"."templateName"::jsonb #>> '{en,US}', "QuestionnaireQuestion"."templateName"::jsonb #>> '{en,*}') as "templateName",COALESCE("QuestionnaireQuestion"."templateDescription"::jsonb #>> '{en,US}', "QuestionnaireQuestion"."templateDescription"::jsonb #>> '{en,*}') as "templateDescription","QuestionnaireQuestion"."creationDate","QuestionnaireQuestion"."modificationDate","QuestionnaireQuestion"."publicationDate"
			FROM "mod_plum_v1"."QuestionnaireQuestion"
			JOIN "mod_plum_v1"."Questionnaire" ON "Questionnaire".id = "QuestionnaireQuestion"."questionnaireId"
			JOIN "mod_plum_v1"."CustomerEngagementQuestionnaire" ON "Questionnaire".id = "CustomerEngagementQuestionnaire"."questionnaireId"
			JOIN "mod_plum_v1"."Organization" ON "Organization".id = "CustomerEngagementQuestionnaire"."organizationId"
			JOIN "mod_plum_v1"."Service" ON "Organization".id = "Service"."vendorId"
			JOIN "mod_plum_v1"."ServiceProductVariant" ON "ServiceProductVariant".id = ANY ("Service"."variantIds")
			JOIN "mod_plum_v1"."ServiceEngagement" ON "ServiceProductVariant".id = "ServiceEngagement"."serviceVariantId"
			WHERE ("QuestionnaireQuestion"."questionnaireId" = 'c4a4d550-99fa-401a-bede-d410b67b75dd' AND ("ServiceEngagement"."originId" = 'aac98df0-52a7-426f-b407-cf7b9cfbe5bc'))
			ORDER BY "QuestionnaireQuestion"."questionnairePosition" ASC
		) r
	),
	'b',(
		SELECT jsonb_agg(row_to_json(r)) b
		from (
			SELECT DISTINCT "QuestionnaireQuestion"."id","QuestionnaireQuestion"."questionnaireId","QuestionnaireQuestion"."questionId","QuestionnaireQuestion"."questionnairePosition",COALESCE("QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,US}', "QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,*}') as "questionnaireLabel","QuestionnaireQuestion"."displayLogicExpression","QuestionnaireQuestion"."maximumNumberOfAnswer","QuestionnaireQuestion"."possibleAnswerIds","QuestionnaireQuestion"."originId","QuestionnaireQuestion"."isTemplate",COALESCE("QuestionnaireQuestion"."templateName"::jsonb #>> '{en,US}', "QuestionnaireQuestion"."templateName"::jsonb #>> '{en,*}') as "templateName",COALESCE("QuestionnaireQuestion"."templateDescription"::jsonb #>> '{en,US}', "QuestionnaireQuestion"."templateDescription"::jsonb #>> '{en,*}') as "templateDescription","QuestionnaireQuestion"."creationDate","QuestionnaireQuestion"."modificationDate","QuestionnaireQuestion"."publicationDate"
			FROM "mod_plum_v1"."QuestionnaireQuestion"
			JOIN "mod_plum_v1"."Questionnaire" ON "Questionnaire".id = "QuestionnaireQuestion"."questionnaireId"
			JOIN "mod_plum_v1"."CustomerEngagementQuestionnaire" ON "Questionnaire".id = "CustomerEngagementQuestionnaire"."questionnaireId"
			JOIN "mod_plum_v1"."Organization" ON "Organization".id = "CustomerEngagementQuestionnaire"."organizationId"
			JOIN "mod_plum_v1"."Service" ON "Organization".id = "Service"."vendorId"
			JOIN "mod_plum_v1"."ServiceProductVariant" ON "ServiceProductVariant".id = ANY ("Service"."variantIds")
			JOIN "mod_plum_v1"."ServiceEngagement" ON "ServiceProductVariant".id = "ServiceEngagement"."serviceVariantId"
			WHERE ("QuestionnaireQuestion"."questionnaireId" = 'af4696c4-84c5-4e92-947d-e0f8d484385d' AND ("ServiceEngagement"."originId" = 'aac98df0-52a7-426f-b407-cf7b9cfbe5bc'))
			ORDER BY "QuestionnaireQuestion"."questionnairePosition" DESC
		) r
	)
) as _

