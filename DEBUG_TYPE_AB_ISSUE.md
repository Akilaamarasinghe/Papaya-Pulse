# Debug Guide: Type A/B Prediction Issue

## Problem
Type B predictions from the ML model are displaying as Type A in the frontend.

## Debugging Steps

### 1. Test the Python IM Service Directly

First, verify the ML model itself works correctly:

```bash
cd papaya-quality-ml-part/IM
python app.py
```

Then test with curl or Postman:
```bash
curl -X POST -F "image=@path/to/type_b_papaya.jpg" http://localhost:5001/predict
```

**Expected output for Type B image:**
```json
{
  "prediction": "Type B",
  "confidence": "XX.XX%",
  "explanation": "..."
}
```

✅ If this shows "Type A" when you test with a Type B image, the problem is in the ML model/training.
✅ If this shows "Type B" correctly, continue to step 2.

---

### 2. Check Backend Logs

Start your backend server with:
```bash
cd backend
node server.js
```

When you upload a Type B image through the app, watch for these console logs:

**Look for:**
```
IM Service Response: {
  "prediction": "Type B",  ← Should be Type B
  "confidence": "XX.XX%",
  "explanation": "..."
}

Sending to frontend: {
  "prediction": "Type B",  ← Should STILL be Type B
  "confidence": "XX.XX%",
  "explanation": "...",
  "quality_category": "factory outlet"
}
```

✅ If "prediction" is "Type A" in "IM Service Response", the problem is in Python service.
✅ If "prediction" is "Type B" in "IM Service Response" but "Type A" in "Sending to frontend", the problem is in backend transformation.
✅ If both show "Type B", continue to step 3.

---

### 3. Check Frontend API Response

Open your app (mobile or web browser) and open the console/debug tools.

When you click "Generate Grade" for a Type B image, look for:

```
===== API RESPONSE RECEIVED =====
Full Response: {
  "prediction": "Type B",  ← Check this value
  "confidence": "XX.XX%",
  "explanation": "...",
  "quality_category": "factory outlet"
}
response.data.prediction: Type B  ← Should be Type B
==================================
```

✅ If this shows "Type A", the problem is in network transmission or backend.
✅ If this shows "Type B", continue to step 4.

---

### 4. Check Result Screen Data Parsing

On the result screen, check the console logs:

```
======= RESULT SCREEN DEBUG START =======
Parsed data: {
  "prediction": "Type B",  ← Check this value
  ...
}
data.prediction VALUE: Type B  ← Should be Type B
data.prediction TYPE: string
Is Type A?: false
Is Type B?: true  ← Should be true for Type B images
======= RESULT SCREEN DEBUG END =======

===== FACTORY OUTLET RENDERING =====
Original data.prediction: Type B
Cleaned predictionValue: Type B  ← Should be Type B
predictionValue === "Type B": true  ← Should be true
=====================================
```

✅ If "Is Type B?" is false and "Is Type A?" is true, the data is corrupted during navigation.
✅ If all values show "Type B" correctly, check the UI.

---

### 5. Check Visual Display (Debug Card)

On the result screen, you'll see a yellow debug card that shows:

```
🔍 Debug Information
RAW data.prediction: "Type B"
CLEANED predictionValue: "Type B"
Type check: ✅ Type B
Confidence: XX.XX%
Category: factory
```

**What the display should show:**
- Large text: "Type B" in orange color (#FF9800)
- Quality Type label: "Type B"
- Description: "Acceptable for factory processing. Some damage detected."
- Recommendations: "Acceptable for factory processing. May require additional sorting or preparation."

---

## Common Issues and Solutions

### Issue 1: ML Model Always Predicts Type A
**Symptom:** Direct curl test shows "Type A" for Type B images
**Solution:** 
- Retrain the model with correct labels
- Check if model file `papaya_model_best.pth` is correct
- Verify training data labels are correct

### Issue 2: Backend Transforms Type B to Type A
**Symptom:** IM Service Response shows "Type B", but frontend receives "Type A"
**Solution:** Check [qualityRoutes.js](backend/routes/qualityRoutes.js) around line 60:
```javascript
const response = {
  prediction: imageAnalysis.prediction,  // Make sure no transformation here
  confidence: imageAnalysis.confidence,
  explanation: imageAnalysis.explanation,
  quality_category: quality_category,
};
```

### Issue 3: Data Loss During Navigation
**Symptom:** API response shows "Type B", but result screen shows "Type A"
**Solution:** Check if JSON.parse/JSON.stringify is corrupting data in [farmer-input.tsx](frontend/app/quality/farmer-input.tsx):
```typescript
router.push({
  pathname: '/quality/farmer-result' as any,
  params: {
    data: JSON.stringify(response.data),  // Check if this preserves Type B
    category: category,
  },
});
```

### Issue 4: String Comparison Issue
**Symptom:** Debug logs show "Type B" but conditions fail
**Solution:** Check for:
- Extra whitespace: "Type B " vs "Type B"
- Different quotes: 'Type B' vs "Type B"
- Case sensitivity: "Type b" vs "Type B"
- Hidden characters

The current code now uses `String(data.prediction || '').trim()` to handle this.

---

## Quick Checklist

Run a Type B image through the system and check:

- [ ] Python service returns "Type B" (curl test)
- [ ] Backend "IM Service Response" log shows "Type B"
- [ ] Backend "Sending to frontend" log shows "Type B"  
- [ ] Frontend "API RESPONSE RECEIVED" log shows "Type B"
- [ ] Result screen "RESULT SCREEN DEBUG START" shows "Type B"
- [ ] Result screen "FACTORY OUTLET RENDERING" shows "Type B"
- [ ] Debug card displays "RAW data.prediction: Type B"
- [ ] Debug card shows "Type check: ✅ Type B"
- [ ] Visual display shows "Type B" in orange color
- [ ] Description mentions "Some damage detected"

---

## Next Steps

After testing with this debug infrastructure:

1. **If the issue is found:** Fix the root cause at the identified step
2. **If all logs show "Type B" correctly but UI still shows "Type A":** Screenshot the debug card and share it
3. **Once fixed:** Remove the debug card and console.log statements from production code

---

## Files Modified for Debugging

1. `backend/routes/qualityRoutes.js` - Added backend logging
2. `frontend/app/quality/farmer-input.tsx` - Added API response logging
3. `frontend/app/quality/farmer-result.tsx` - Added comprehensive result screen debugging
