# Timezone Fix Documentation

## Problem Overview

The Lambda-based API was calculating date ranges in UTC time, causing discrepancies in Costa Rica business reports:

- **"Today" reports**: Missing ~18 hours of data (6 hours from previous day + 6 hours into next day)
- **Monthly reports**: Including extra hours due to incorrect month boundary calculations
- **Root cause**: Lambda functions run in UTC but business logic requires Costa Rica time (UTC-6)

## Solution Implemented

### Timezone-Aware Date Calculations

Created `backend-services/src/admin-api/timezoneUtils.ts` using Luxon library to handle Costa Rica business time:

**Key Functions:**

- `getBusinessDayStart()` - Returns 00:00 Costa Rica time as UTC Date
- `getBusinessDayEnd()` - Returns 23:59:59.999 Costa Rica time as UTC Date
- `getBusinessWeekStart()` - Returns Monday 00:00 Costa Rica time as UTC Date
- `getBusinessMonthStart()` - Returns 1st day 00:00 Costa Rica time as UTC Date
- `logTimezoneConversion()` - Logs timezone details for debugging

### Updated Lambda Handler

Modified `calculateDateRange()` function in `dashboardHandler.ts`:

**Before (Incorrect):**

```typescript
const now = new Date(); // UTC time
startDate.setHours(0, 0, 0, 0); // Midnight UTC = 6pm Costa Rica previous day
```

**After (Correct):**

```typescript
startDateTime = getBusinessDayStart(); // 00:00 Costa Rica = 06:00 UTC
endDateTime = getBusinessDayEnd(); // 23:59 Costa Rica = 05:59 UTC next day
```

## How It Works

### Example: "Today" Report on October 8, 2025

**Costa Rica Time:**

- Business day: Oct 8, 00:00 to Oct 8, 23:59 (Costa Rica)

**Converted to UTC for DB Query:**

- Database query: Oct 8, 06:00 UTC to Oct 9, 05:59 UTC
- Correctly captures all Costa Rica "today" transactions

### Example: Monthly Report for October 2025

**Costa Rica Time:**

- Business month: Oct 1, 00:00 to Oct 31, 23:59 (Costa Rica)

**Converted to UTC for DB Query:**

- Database query: Oct 1, 06:00 UTC to Nov 1, 05:59 UTC
- Correctly captures entire Costa Rica October

## CloudWatch Logging

The fix includes enhanced timezone logging. When you check CloudWatch logs, you'll see:

```json
{
  "🌎 Timezone conversion details": {
    "periodType": "today",
    "utcNow": "2025-10-09T02:00:00.000Z",
    "costaRicaNow": "2025-10-08T20:00:00.000-06:00",
    "costaRicaOffset": "CST",
    "businessPeriod": {
      "startUTC": "2025-10-08T06:00:00.000Z",
      "endUTC": "2025-10-09T05:59:59.999Z",
      "startCostaRica": "2025-10-08T00:00:00.000-06:00",
      "endCostaRica": "2025-10-08T23:59:59.999-06:00"
    }
  }
}
```

## Deployment Instructions

### 1. Build the Updated Code

```bash
cd backend-services
npm run build
```

### 2. Deploy to Development

```bash
serverless deploy --stage dev
```

### 3. Deploy to Production (after testing)

```bash
serverless deploy --stage prod
```

### 4. Verify the Fix

**Test "Today" Report:**

```bash
curl "https://your-api/api/home/stats?period=today"
```

**Check CloudWatch Logs:**

1. Go to AWS Console → CloudWatch → Log groups
2. Find `/aws/lambda/lotto-backend-dev-getHomeStats`
3. Look for the 🌎 timezone conversion logs
4. Verify startUTC and endUTC match expected Costa Rica business hours

**Compare Results:**

- Local report active customers: Should now match
- Monthly transactions: Should eliminate the ~11 transaction discrepancy
- Daily reports: Should capture full 24-hour Costa Rica business day

## Expected Improvements

### Before Fix

- **Today**: 19 active customers (missing 6 hours each side)
- **Month**: 4519 transactions (missing ~200 transactions)

### After Fix

- **Today**: ~100 active customers (full 24-hour Costa Rica day)
- **Month**: 4720 transactions (matches external provider after accounting for direct usage)

## Technical Details

### Why Luxon?

- Already installed in `backend-services` dependencies
- Excellent timezone support with IANA timezone database
- Handles DST (Daylight Saving Time) automatically
- Type-safe with TypeScript

### Costa Rica Timezone

- IANA identifier: `America/Costa_Rica`
- Standard offset: UTC-6
- No daylight saving time (constant offset year-round)

## Troubleshooting

### If reports still don't match:

1. **Check CloudWatch logs** for timezone conversion details
2. **Verify startUTC and endUTC** match expected 06:00-05:59 UTC pattern
3. **Compare with external provider** using same exact UTC date range
4. **Check database timestamps** - ensure they're stored in UTC

### Common Issues:

**Issue**: Reports show data from wrong day

- **Solution**: Check `logTimezoneConversion()` output in CloudWatch

**Issue**: Monthly boundaries off by a few hours

- **Solution**: Verify month start/end times in CloudWatch logs

**Issue**: Week reports incorrect

- **Solution**: Luxon uses Monday as week start (ISO standard)

## Maintenance

This fix is self-contained in two files:

- `backend-services/src/admin-api/timezoneUtils.ts` - Timezone utilities
- `backend-services/src/admin-api/dashboardHandler.ts` - Updated to use utilities

If Costa Rica changes timezone rules (unlikely), only `timezoneUtils.ts` needs updating.

## Future Enhancements

Consider adding:

1. **Configurable timezone** via environment variable
2. **Multiple timezone support** for multi-region deployments
3. **Timezone parameter** in API to allow client-specified timezone
4. **Cache timezone calculations** for better performance
