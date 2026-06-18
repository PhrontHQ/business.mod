# MJSON Configuration Files Validation Report

**Directory:** `data/model/questionnaire`
**Date:** 2026-01-08
**Total Files Processed:** 8

---

## Inventory

The following MJSON files were discovered and analyzed:

1. `answer.mjson`
2. `question.mjson`
3. `questionnaire.mjson`
4. `questionnaire-question.mjson`
5. `respondent-questionnaire.mjson`
6. `respondent-questionnaire-answer.mjson`
7. `respondent-questionnaire-variable-value.mjson`
8. `variable.mjson`

---

## Issues Report

### 1. answer.mjson
**Status:** ✅ **Valid**

- **Syntax:** Valid JSON
- **Inheritance:** Properly defined (`parent: {"@": "objectDescriptor"}` → `mod/data/model/data-object.mjson`)
- **Property Descriptors:** All 15 properties have matching definitions
- **References:** All internal references are valid

---

### 2. question.mjson
**Status:** ✅ **Valid**

- **Syntax:** Valid JSON
- **Inheritance:** Properly defined (`parent: {"@": "objectDescriptor"}` → `mod/data/model/data-object.mjson`)
- **Property Descriptors:** All 7 properties have matching definitions
- **References:** All internal references are valid

---

### 3. questionnaire.mjson
**Status:** ✅ **Valid**

- **Syntax:** Valid JSON
- **Inheritance:** Properly defined (`parent: {"@": "objectDescriptor"}` → `mod/data/model/data-object.mjson`)
- **Property Descriptors:** All 11 properties have matching definitions
- **References:** All internal references are valid

---

### 4. questionnaire-question.mjson
**Status:** ⚠️ **Issue Detected**

- **Syntax:** Valid JSON
- **Inheritance:** Properly defined (`parent: {"@": "objectDescriptor"}` → `mod/data/model/data-object.mjson`)
- **Property Descriptors:** All 8 declared properties have matching definitions

**Issue:** Orphaned Property Definition
- **Lines 123-131:** The property `"notes"` is fully defined but **NOT included** in the `propertyDescriptors` array
- **Impact:** This property exists in the schema but is not exposed/registered, making it effectively unusable
- **Recommendation:** Either add `{"@": "notes"}` to the `propertyDescriptors` array or remove the definition if not needed

```json
// Missing from propertyDescriptors array:
{"@": "notes"}
```

---

### 5. respondent-questionnaire.mjson
**Status:** ✅ **Valid**

- **Syntax:** Valid JSON
- **Inheritance:** Properly defined (`parent: {"@": "objectDescriptor"}` → `mod/data/model/data-object.mjson`)
- **Property Descriptors:** All 9 properties have matching definitions
- **References:** All internal references are valid

---

### 6. respondent-questionnaire-answer.mjson
**Status:** ✅ **Valid**

- **Syntax:** Valid JSON
- **Inheritance:** Properly defined (`parent: {"@": "objectDescriptor"}` → `mod/data/model/data-object.mjson`)
- **Property Descriptors:** All 5 properties have matching definitions
- **References:** All internal references are valid

---

### 7. respondent-questionnaire-variable-value.mjson
**Status:** ✅ **Valid**

- **Syntax:** Valid JSON
- **Inheritance:** Properly defined (`parent: {"@": "objectDescriptor"}` → `mod/data/model/data-object.mjson`)
- **Property Descriptors:** All 3 properties have matching definitions
- **References:** All internal references are valid

---

### 8. variable.mjson
**Status:** ⚠️ **Issue Detected**

- **Syntax:** Valid JSON
- **Inheritance:** Properly defined (`parent: {"@": "modVariableObjectDescriptor"}` → `mod/data/model/variable.mjson`)
- **Property Descriptors:** All 3 properties have matching definitions

**Issue:** Unused Definition
- **Lines 26-28:** The key `"variablePrototype"` is defined with `"object": "./variable"` but is **never referenced** anywhere in the file
- **Impact:** Dead code that clutters the configuration
- **Recommendation:** Remove this unused definition or identify where it should be used

```json
// Unused definition that can be removed:
"variablePrototype": {
    "object": "./variable"
}
```

**Note:** The file already has a `"variable"` key (lines 23-25) that serves the same purpose and is properly referenced by `root.values.object`.

---

## Summary

| File | Status | Issues |
|------|--------|--------|
| answer.mjson | ✅ Valid | None |
| question.mjson | ✅ Valid | None |
| questionnaire.mjson | ✅ Valid | None |
| questionnaire-question.mjson | ⚠️ Issue | Orphaned property definition (`notes`) |
| respondent-questionnaire.mjson | ✅ Valid | None |
| respondent-questionnaire-answer.mjson | ✅ Valid | None |
| respondent-questionnaire-variable-value.mjson | ✅ Valid | None |
| variable.mjson | ⚠️ Issue | Unused definition (`variablePrototype`) |

**Total Issues Found:** 2

---

## Recommendations

1. **questionnaire-question.mjson:** Add the `notes` property to the `propertyDescriptors` array to make it accessible, or remove the definition if it's not needed.

2. **variable.mjson:** Remove the unused `variablePrototype` definition to clean up the configuration file.

Both issues are non-critical but should be addressed to maintain clean, consistent MJSON configurations.
