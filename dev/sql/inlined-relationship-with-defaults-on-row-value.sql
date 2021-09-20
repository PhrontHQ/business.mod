SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "QuestionnaireQuestion"."id","QuestionnaireQuestion"."publicationDate","QuestionnaireQuestion"."modificationDate","QuestionnaireQuestion"."creationDate","QuestionnaireQuestion"."originId","QuestionnaireQuestion"."possibleAnswerIds","QuestionnaireQuestion"."maximumNumberOfAnswer","QuestionnaireQuestion"."displayLogicExpression",COALESCE("QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,US}', "QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,*}', "QuestionnaireQuestion"."questionnaireLabel"::jsonb #>> '{en,*}') as "questionnaireLabel","QuestionnaireQuestion"."questionnairePosition",
										  	COALESCE(
												(SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Question"."id","Question"."publicationDate","Question"."modificationDate","Question"."creationDate","Question"."originId",COALESCE("Question"."notes"::jsonb #>> '{en,US}', "Question"."notes"::jsonb #>> '{en,*}', "Question"."notes"::jsonb #>> '{en,*}') as "notes","Question"."isOpenEnded","Question"."variableIds","Question"."subQuestions","Question"."superQuestionId",COALESCE("Question"."name"::jsonb #>> '{en,US}', "Question"."name"::jsonb #>> '{en,*}', "Question"."name"::jsonb #>> '{en,*}') as "name",COALESCE("Question"."text"::jsonb #>> '{en,US}', "Question"."text"::jsonb #>> '{en,*}', "Question"."text"::jsonb #>> '{en,*}') as "text") as _) FROM phront."Question" WHERE ("Question"."id" = "QuestionnaireQuestion"."questionId")),
												(SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Question"."id","Question"."publicationDate","Question"."modificationDate","Question"."creationDate","Question"."originId",COALESCE("Question"."notes"::jsonb #>> '{en,US}', "Question"."notes"::jsonb #>> '{en,*}', "Question"."notes"::jsonb #>> '{en,*}') as "notes","Question"."isOpenEnded","Question"."variableIds","Question"."subQuestions","Question"."superQuestionId",COALESCE("Question"."name"::jsonb #>> '{en,US}', "Question"."name"::jsonb #>> '{en,*}', "Question"."name"::jsonb #>> '{en,*}') as "name",COALESCE("Question"."text"::jsonb #>> '{en,US}', "Question"."text"::jsonb #>> '{en,*}', "Question"."text"::jsonb #>> '{en,*}') as "text") as _) FROM phront."Question" WHERE ("Question"."id" = '8bfb4262-f27d-4c41-9ca5-0b335e5ff30b')),
												(SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Question"."id","Question"."publicationDate","Question"."modificationDate","Question"."creationDate","Question"."originId",COALESCE("Question"."notes"::jsonb #>> '{en,US}', "Question"."notes"::jsonb #>> '{en,*}', "Question"."notes"::jsonb #>> '{en,*}') as "notes","Question"."isOpenEnded","Question"."variableIds","Question"."subQuestions","Question"."superQuestionId",COALESCE("Question"."name"::jsonb #>> '{en,US}', "Question"."name"::jsonb #>> '{en,*}', "Question"."name"::jsonb #>> '{en,*}') as "name",COALESCE("Question"."text"::jsonb #>> '{en,US}', "Question"."text"::jsonb #>> '{en,*}', "Question"."text"::jsonb #>> '{en,*}') as "text") as _) FROM phront."Question" WHERE ("Question"."id" = '7c020d99-9579-4f2d-a578-6afed55461c9'))
											)
										  	as "question",
										  	"QuestionnaireQuestion"."questionnaireId") as _)
FROM phront."QuestionnaireQuestion" JOIN "phront"."Questionnaire" ON "Questionnaire".id = "QuestionnaireQuestion"."questionnaireId" JOIN "phront"."CustomerEngagementQuestionnaire" ON "Questionnaire".id = "CustomerEngagementQuestionnaire"."questionnaireId" JOIN "phront"."Organization" ON "CustomerEngagementQuestionnaire".id = ANY ("Organization"."customerEngagementQuestionnaireIds") JOIN "phront"."Service" ON "Organization".id = "Service"."vendorId" JOIN "phront"."ServiceProductVariant" ON "ServiceProductVariant".id = ANY ("Service"."variantIds") JOIN "phront"."ServiceEngagement" ON "ServiceProductVariant".id = "ServiceEngagement"."serviceVariantId"
WHERE ("QuestionnaireQuestion"."questionnaireId" = '9da2fa08-73df-438c-b954-4f7007b8563f' AND           ("ServiceEngagement"."originId" = '187cfa9a-c303-4737-a770-17d46e7524a4'))


/*
    Selecting participationStatusExpectedTimeOffsetsKeys and participationStatusExpectedTimeOffsetsValues defaults for Events

*/
SELECT DISTINCT (SELECT to_jsonb(_) FROM (SELECT "Event"."id","Event"."participatingPersonId","Event"."participatingResourceId","Event"."calendarId","Event"."scheduledTimeRange","Event"."actualTimeRange","Event"."parentId","Event"."isBlocking","Event"."participation","Event"."participationRoleIds","Event"."participationStatus","Event"."participationStatusLogKeys","Event"."participationStatusLogValues",
										  COALESCE(
											  "Event"."participationStatusExpectedTimeOffsetsKeys",
											  (
												select distinct "participationStatusExpectedTimeOffsetsKeys"
												from phront."Event" "EventTemplate"
												JOIN "phront"."Calendar" ON "Calendar".id = "Event"."calendarId"
												JOIN "phront"."B2CCustomerSupplierRelationship" ON "B2CCustomerSupplierRelationship".id = "Calendar"."ownerB2cCustomerSupplierRelationshipId"
												JOIN "phront"."Organization" ON "Organization".id = "B2CCustomerSupplierRelationship"."supplierId"
												LEFT JOIN "phront"."Organization" "parentIdOrganization" ON "parentIdOrganization".id = "Organization"."parentId"
												JOIN "phront"."B2CCustomerSupplierRelationship" "TemplateB2CCustomerSupplierRelationship" ON "parentIdOrganization".id = "TemplateB2CCustomerSupplierRelationship"."supplierId"
												JOIN "phront"."Calendar" "CalendarTemplate" ON "TemplateB2CCustomerSupplierRelationship".id = "CalendarTemplate"."ownerB2cCustomerSupplierRelationshipId"
												JOIN "phront"."Role" ON "Role".id = ANY ("EventTemplate"."participationRoleIds")
												where
													"CalendarTemplate".id = "EventTemplate"."calendarId"
												  	AND (
														"TemplateB2CCustomerSupplierRelationship"."isTemplate" = true
														 AND (
														 	COALESCE("TemplateB2CCustomerSupplierRelationship"."templateName"::jsonb #>> '{en,US}', "TemplateB2CCustomerSupplierRelationship"."templateName"::jsonb #>> '{en,*}') = 'PracticePatientRelationshipTemplate'
														 	AND (
																"EventTemplate"."isTemplate" = true
																AND (
																	COALESCE("Role"."name"::jsonb #>> '{en,US}', "Role"."name"::jsonb #>> '{en,*}') = 'Patient'
																	OR
																	COALESCE("Role"."name"::jsonb #>> '{en,US}', "Role"."name"::jsonb #>> '{en,*}') = 'Attendee'
																)
															)
														 )
													)
											  )
										  ) as "participationStatusExpectedTimeOffsetsKeys",
										  COALESCE(
											  		"Event"."participationStatusExpectedTimeOffsetsValues",
											  (
												select distinct "participationStatusExpectedTimeOffsetsValues"
												from phront."Event" "EventTemplate"
												JOIN "phront"."Calendar" ON "Calendar".id = "Event"."calendarId"
												JOIN "phront"."B2CCustomerSupplierRelationship" ON "B2CCustomerSupplierRelationship".id = "Calendar"."ownerB2cCustomerSupplierRelationshipId"
												JOIN "phront"."Organization" ON "Organization".id = "B2CCustomerSupplierRelationship"."supplierId"
												LEFT JOIN "phront"."Organization" "parentIdOrganization" ON "parentIdOrganization".id = "Organization"."parentId"
												JOIN "phront"."B2CCustomerSupplierRelationship" "TemplateB2CCustomerSupplierRelationship" ON "parentIdOrganization".id = "TemplateB2CCustomerSupplierRelationship"."supplierId"
												JOIN "phront"."Calendar" "CalendarTemplate" ON "TemplateB2CCustomerSupplierRelationship".id = "CalendarTemplate"."ownerB2cCustomerSupplierRelationshipId"
												JOIN "phront"."Role" ON "Role".id = ANY ("EventTemplate"."participationRoleIds")
												where
													"CalendarTemplate".id = "EventTemplate"."calendarId"
												  	AND (
														"TemplateB2CCustomerSupplierRelationship"."isTemplate" = true
														 AND (
														 	COALESCE("TemplateB2CCustomerSupplierRelationship"."templateName"::jsonb #>> '{en,US}', "TemplateB2CCustomerSupplierRelationship"."templateName"::jsonb #>> '{en,*}') = 'PracticePatientRelationshipTemplate'
														 	AND (
																"EventTemplate"."isTemplate" = true
																AND (
																	COALESCE("Role"."name"::jsonb #>> '{en,US}', "Role"."name"::jsonb #>> '{en,*}') = 'Patient'
																	OR
																	COALESCE("Role"."name"::jsonb #>> '{en,US}', "Role"."name"::jsonb #>> '{en,*}') = 'Attendee'
																)
															)
														 )
													)
											  )
										  ) as "participationStatusExpectedTimeOffsetsValues",

										  "Event"."reminderIds","Event"."eventURL","Event"."summary","Event"."description","Event"."locationId","Event"."colorId","Event"."isAllDay","Event"."recurrenceRule","Event"."recurringEventId","Event"."visibility","Event"."iCalUID","Event"."sequence","Event"."conferenceData","Event"."anyoneCanAddSelf","Event"."guestsCanInviteOthers","Event"."guestsCanModify","Event"."guestsCanSeeOtherGuests","Event"."privateCopy","Event"."locked","Event"."attachments","Event"."respondentQuestionnaireIds","Event"."originId","Event"."isTemplate",COALESCE("Event"."templateName"::jsonb #>> '{en,US}', "Event"."templateName"::jsonb #>> '{en,*}', "Event"."templateName"::jsonb #>> '{en,*}') as "templateName",COALESCE("Event"."templateDescription"::jsonb #>> '{en,US}', "Event"."templateDescription"::jsonb #>> '{en,*}', "Event"."templateDescription"::jsonb #>> '{en,*}') as "templateDescription","Event"."creationDate","Event"."modificationDate","Event"."publicationDate") as _)
FROM phront."Event"
WHERE (
	"Event"."parentId" is not null
	AND (
		("Event"."originId" = '5211a03d-37f4-42cd-bd6a-c9d7a947c45b')
	)
)
