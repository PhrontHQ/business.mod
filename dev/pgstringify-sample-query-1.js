var mainQuestionnaireCriteria13 = new Criteria().initWithExpression("respondentQuestionnaires.filter{questionnaire.name == $.questionnaireName && respondentAnswers.some{questionnaireQuestion.question.name == $.questionName && answers.some{booleanValue == true}}} && originId == $.originId && parent != null", {
    originId: originId,
    questionnaireName: 'AAOIC Consent Questionnaire',
    questionName: 'acceptsConsent'
});


syntax = {
    "type": "and",
    "args": [
        {
            "type": "and",
            "args": [
                {
                    "type": "filterBlock",
                    "args": [
                        {
                            "type": "property",
                            "args": [
                                {
                                    "type": "value"
                                },
                                {
                                    "type": "literal",
                                    "value": "respondentQuestionnaires"
                                }
                            ]
                        },
                        {
                            "type": "and",
                            "args": [
                                {
                                    "type": "equals",
                                    "args": [
                                        {
                                            "type": "property",
                                            "args": [
                                                {
                                                    "type": "property",
                                                    "args": [
                                                        {
                                                            "type": "value"
                                                        },
                                                        {
                                                            "type": "literal",
                                                            "value": "questionnaire"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "type": "literal",
                                                    "value": "name"
                                                }
                                            ]
                                        },
                                        {
                                            "type": "property",
                                            "args": [
                                                {
                                                    "type": "parameters"
                                                },
                                                {
                                                    "type": "literal",
                                                    "value": "questionnaireName"
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    "type": "someBlock",
                                    "args": [
                                        {
                                            "type": "property",
                                            "args": [
                                                {
                                                    "type": "value"
                                                },
                                                {
                                                    "type": "literal",
                                                    "value": "respondentAnswers"
                                                }
                                            ]
                                        },
                                        {
                                            "type": "and",
                                            "args": [
                                                {
                                                    "type": "equals",
                                                    "args": [
                                                        {
                                                            "type": "property",
                                                            "args": [
                                                                {
                                                                    "type": "property",
                                                                    "args": [
                                                                        {
                                                                            "type": "property",
                                                                            "args": [
                                                                                {
                                                                                    "type": "value"
                                                                                },
                                                                                {
                                                                                    "type": "literal",
                                                                                    "value": "questionnaireQuestion"
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "type": "literal",
                                                                            "value": "question"
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    "type": "literal",
                                                                    "value": "name"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "type": "property",
                                                            "args": [
                                                                {
                                                                    "type": "parameters"
                                                                },
                                                                {
                                                                    "type": "literal",
                                                                    "value": "questionName"
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                },
                                                {
                                                    "type": "someBlock",
                                                    "args": [
                                                        {
                                                            "type": "property",
                                                            "args": [
                                                                {
                                                                    "type": "value"
                                                                },
                                                                {
                                                                    "type": "literal",
                                                                    "value": "answers"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "type": "equals",
                                                            "args": [
                                                                {
                                                                    "type": "property",
                                                                    "args": [
                                                                        {
                                                                            "type": "value"
                                                                        },
                                                                        {
                                                                            "type": "literal",
                                                                            "value": "booleanValue"
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    "type": "literal",
                                                                    "value": true
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "type": "equals",
                    "args": [
                        {
                            "type": "property",
                            "args": [
                                {
                                    "type": "value"
                                },
                                {
                                    "type": "literal",
                                    "value": "originId"
                                }
                            ]
                        },
                        {
                            "type": "property",
                            "args": [
                                {
                                    "type": "parameters"
                                },
                                {
                                    "type": "literal",
                                    "value": "originId"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "type": "not",
            "args": [
                {
                    "type": "equals",
                    "args": [
                        {
                            "type": "property",
                            "args": [
                                {
                                    "type": "value"
                                },
                                {
                                    "type": "literal",
                                    "value": "parent"
                                }
                            ]
                        },
                        {
                            "type": "literal",
                            "value": null
                        }
                    ]
                }
            ]
        }
    ]
}
