"""
Simple Test Example - Stage Transition Guidance
Shows exactly what responses look like (no prices/economics)
"""

import json

# ============================================================================
# EXAMPLE 1: Stage A → Stage B Transition
# ============================================================================

stage_a_response = {
    "current_stage": {
        "code": "a",
        "name": "Stage A",
        "duration": "0-2 months",
        "height": "15-30 cm",
        "characteristics": "4-8 true leaves, thin tender stems, light green leaves, developing taproot"
    },
    "care_instructions": {
        "watering": "Daily light watering (200-300ml per plant), keep moist not waterlogged, morning/evening",
        "fertilizer": "NPK 15-15-15 at 10-15g every 2 weeks (start at 3-4 weeks), weekly seaweed foliar spray",
        "protection": "50-70% shade cloth, protect from strong wind and heavy rain",
        "soil": "pH 6.0-6.5, well-drained with organic mulch",
        "spacing": "10-15 cm in nursery, use 15x20 cm polybags"
    },
    "critical_actions": [
        "Transplant when 15-20 cm tall with 5-6 leaves",
        "Harden off plants 1 week before transplanting",
        "Apply Trichoderma to prevent damping-off disease",
        "Monitor for cutworms and aphids daily",
        "Prepare main field with deep plowing"
    ],
    "problems_and_solutions": {
        "common_problems": "Damping-off disease, cutworms, aphids, root rot from overwatering",
        "solutions": "Use Trichoderma, copper-based fungicides (Bordeaux mixture), neem oil for aphids, ensure drainage"
    },
    "transition_guide": {
        "next_stage": "Stage B (in 1-2 months)",
        "signs_to_watch": "stems thickening, reaching 30-40 cm height, 8-10 weeks old",
        "transition_focus": "Focus on protection and establishing strong roots. Prepare for transplanting when conditions are right."
    },
    "expert_guidance": "Your seedlings are in their most delicate phase. Apply light watering (200-300ml) twice daily and start NPK 15-15-15 fertilizer at 3-4 weeks. Most importantly, apply Trichoderma fungicide to prevent damping-off disease which can wipe out entire trays. Watch for your plants reaching 15-20 cm height with 5-6 healthy leaves - that's your signal to transplant to the main field. Harden them off one week before moving by gradually reducing shade."
}

print("="*80)
print("EXAMPLE 1: STAGE A (Seedling) - How to reach Stage B")
print("="*80)
print(json.dumps(stage_a_response, indent=2))

# ============================================================================
# EXAMPLE 2: Stage B → Stage C Transition
# ============================================================================

stage_b_response = {
    "current_stage": {
        "code": "b",
        "name": "Stage B",
        "duration": "2-5 months",
        "height": "40-100 cm",
        "characteristics": "15-25 leaves, stem 3-5 cm diameter, darker green leaves, active vegetative growth, no flowers yet"
    },
    "care_instructions": {
        "watering": "Every 2-3 days (2-5 liters per plant), deep watering for root development, reduce in rainy season",
        "fertilizer": "NPK 14-14-14 at 50-75g every 3 weeks, monthly magnesium sulfate (25g), calcium if acidic soil",
        "protection": "Full sunlight required now, control aphids aggressively (PRSV vectors), regular field monitoring",
        "soil": "Apply 5-8 cm organic mulch, ensure good drainage",
        "spacing": "Field spacing 2x2m (2500 plants/ha) or 2.5x2.5m for better air circulation"
    },
    "critical_actions": [
        "Monitor for Papaya Ringspot Virus (PRSV) - remove infected plants immediately",
        "Control aphid populations weekly (neem oil, imidacloprid)",
        "Establish regular fertilization schedule",
        "Install windbreaks if needed",
        "Prepare for flowering and plant sexing",
        "Use yellow sticky traps for whiteflies"
    ],
    "problems_and_solutions": {
        "common_problems": "Papaya Ringspot Virus (PRSV), aphids, whiteflies, mealybugs, root knot nematodes",
        "solutions": "Aggressive aphid control, immediate removal of PRSV plants, nematicides if needed, weekly monitoring"
    },
    "transition_guide": {
        "next_stage": "Stage C (in 1-3 months)",
        "signs_to_watch": "flower buds appearing at leaf axils, height 80-100 cm, 4.5-5 months age",
        "transition_focus": "Build strong plant structure and prevent diseases. Watch for flower buds to appear - that signals readiness for Stage C."
    },
    "expert_guidance": "At Stage B, your focus is building a disease-free, strong plant structure. Water deeply (2-5 liters every 2-3 days) and apply NPK 14-14-14 fertilizer (50-75g every 3 weeks). Your biggest threat is Papaya Ringspot Virus spread by aphids - spray neem oil or imidacloprid weekly without fail. Inspect every plant weekly for distorted leaves or yellow rings, and remove infected ones immediately. Around 4.5-5 months, you'll see flower buds forming at leaf axils where leaves meet the stem - that's your signal to prepare for Stage C."
}

print("\n" + "="*80)
print("EXAMPLE 2: STAGE B (Juvenile) - How to reach Stage C")
print("="*80)
print(json.dumps(stage_b_response, indent=2))

# ============================================================================
# EXAMPLE 3: Stage C → Stage D Transition
# ============================================================================

stage_c_response = {
    "current_stage": {
        "code": "c",
        "name": "Stage C",
        "duration": "5-7 months",
        "height": "100-150 cm",
        "characteristics": "25-35 leaves, flowers at leaf axils, trunk 5-8 cm diameter, sex determination visible"
    },
    "care_instructions": {
        "watering": "Critical! 5-10 liters every 2-3 days, consistent moisture essential, drip irrigation ideal (2-4 L/hr, 2-3x/week)",
        "fertilizer": "NPK 12-12-17 (high potassium) at 100-150g every 3 weeks, boron 5-10g monthly, calcium 50g monthly",
        "protection": "Install pheromone traps for fruit flies, apply fruit fly bait sprays, maintain air circulation",
        "soil": "Mulch heavily to retain moisture, ensure 6-8 hours daily sunlight",
        "spacing": "Already established (2-2.5m), ensure good air circulation"
    },
    "critical_actions": [
        "SEX ROGUING: Remove all male plants (keep 1 male per 25-50 plants if needed)",
        "Keep hermaphrodites (self-fertile, produce best fruit)",
        "Remove lower yellow/dead leaves, maintain 20-25 active leaves",
        "Install support stakes in windy areas",
        "Begin intensive pest monitoring",
        "Prepare for harvest in 6-8 weeks",
        "Apply fungicides for powdery mildew if present"
    ],
    "problems_and_solutions": {
        "common_problems": "Fruit flies, powdery mildew, Phytophthora fruit rot, flower abortion, spider mites, mealybugs",
        "solutions": "Pheromone traps, fruit bagging, sulfur-based fungicides, maintain consistent soil moisture, remove infected parts"
    },
    "transition_guide": {
        "next_stage": "Stage D (in 4-8 weeks)",
        "signs_to_watch": "fruits setting and enlarging to 5-10 cm, typically 6.5-7 months after germination",
        "transition_focus": "Protect flowers and conduct sex roguing now. Proper care ensures healthy fruit development in Stage D."
    },
    "expert_guidance": "Stage C is flowering time! Your critical task this week is sex roguing - identify and remove all male plants (they have long branched flower clusters and produce no fruit). Keep hermaphrodite plants with elongated flowers as they're self-fertile and produce the best commercial papayas. Water consistently (5-10 liters every 2-3 days) because water stress causes flower drop. Switch to NPK 12-12-17 fertilizer (100-150g every 3 weeks) - note the higher potassium for flower development. Install pheromone traps for fruit flies NOW before fruits appear. In 4-8 weeks, you'll see baby fruits forming at 5-10 cm - that marks your transition to Stage D."
}

print("\n" + "="*80)
print("EXAMPLE 3: STAGE C (Pre-fruiting) - How to reach Stage D")
print("="*80)
print(json.dumps(stage_c_response, indent=2))

# ============================================================================
# EXAMPLE 4: Stage D - Continuous Production
# ============================================================================

stage_d_response = {
    "current_stage": {
        "code": "d",
        "name": "Stage D",
        "duration": "7-8 months onwards (continues 2-3 years)",
        "height": "150-300+ cm",
        "characteristics": "Fruits at various stages, continuous flowering, 20-30 crown leaves, trunk 8-15 cm, first harvest 8-10 months"
    },
    "care_instructions": {
        "watering": "10-20 liters every 2-3 days, increase in dry season, drip: 4-8 L/hr 3-4x/week, reduce slightly 1 week before harvest",
        "fertilizer": "NPK 8-10-13 (high potassium) at 150-250g every 3-4 weeks, Annual: 300-400g N, 200g P₂O₅, 400-600g K₂O, organic compost 10-15kg/3 months",
        "protection": "Active fruit fly management, PRSV monitoring, regular sanitation, integrated pest management (IPM)",
        "soil": "Maintain mulch, excellent drainage crucial",
        "spacing": "Maintain 2-2.5m spacing, thin if too dense"
    },
    "critical_actions": [
        "HARVEST: When fruit shows 10-15% yellow (market) or fully ripe (local), every 3-5 days",
        "Use clean sharp knife, leave 1-2 cm stem, handle carefully",
        "Remove malformed fruits early, practice fruit thinning if excessive",
        "Weekly removal of old yellow lower leaves (keep 25-30 active leaves)",
        "Cut trunk back if >3m for easier harvesting",
        "Post-harvest: Hot water treatment 49°C for 20 min (anthracnose prevention)",
        "Replace plants after 2-3 years or when production drops"
    ],
    "problems_and_solutions": {
        "common_problems": "Fruit flies (major), PRSV, anthracnose on ripe fruits, Phytophthora rot, powdery mildew, root rot",
        "solutions": "Pheromone traps, bait sprays, fruit bagging, remove PRSV plants, copper fungicides, post-harvest hot water treatment, IPM approach"
    },
    "transition_guide": {
        "next_stage": "Continuous production for 2-3 years, then replace",
        "signs_to_watch": "Production declines after Year 3, establish new plantations for continuous supply",
        "transition_focus": "Harvest when fruit shows 10-15% yellow for market. Pick every 3-5 days for continuous production."
    },
    "expert_guidance": "Congratulations on reaching fruiting stage! Harvest timing is critical - pick fruits when they show 10-15% yellow color for best market shelf life. Check every 3-5 days and use a clean sharp knife, leaving 1-2cm of stem. Water heavily (10-20 liters every 2-3 days) and apply NPK 8-10-13 fertilizer (150-250g every 3-4 weeks) - the high potassium ensures quality fruit. Your main enemy is fruit flies - maintain pheromone traps, apply bait sprays weekly, and consider bagging premium fruits. After harvest, treat fruits in 49°C water for 20 minutes to prevent anthracnose rot. Plan to establish new plants now because production will peak in Year 2 then decline by Year 3."
}

print("\n" + "="*80)
print("EXAMPLE 4: STAGE D (Fruiting) - Continuous Production")
print("="*80)
print(json.dumps(stage_d_response, indent=2))

# ============================================================================
# SUMMARY
# ============================================================================

print("\n" + "="*80)
print("RESPONSE STRUCTURE SUMMARY")
print("="*80)
print("""
Every response includes:

1. CURRENT_STAGE
   - code (a/b/c/d)
   - name
   - duration (age range)
   - height range
   - key characteristics

2. CARE_INSTRUCTIONS
   - watering (frequency, amount)
   - fertilizer (NPK ratio, amount, frequency)
   - protection measures
   - soil requirements
   - spacing guidelines

3. CRITICAL_ACTIONS
   - List of must-do tasks THIS WEEK
   - Prioritized by importance

4. PROBLEMS_AND_SOLUTIONS
   - Common problems at this stage
   - Specific solutions/treatments

5. TRANSITION_GUIDE
   - next_stage name and timeline
   - signs_to_watch (how to know when ready)
   - transition_focus (what to prioritize)

6. EXPERT_GUIDANCE
   - AI-generated personalized advice
   - Focuses on current care + transition steps
   - Simple language, actionable steps

❌ NO PRICES
❌ NO ECONOMICS
❌ NO MARKET DATA

✅ PURE AGRICULTURAL GUIDANCE
✅ STAGE TRANSITION FOCUSED
✅ ACTIONABLE INSTRUCTIONS
""")
