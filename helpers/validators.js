export const validateSubscriptionData = (data, isUpdate = false) => {
  const errors = [];
  
  // Helper to check if value exists (allowing 0 as valid)
  const exists = (val) => val !== undefined && val !== null && val !== '';

  // For create operations, check all required fields
  if (!isUpdate) {
    if (!exists(data.slug)) errors.push('slug is required');
    if (!exists(data.name)) errors.push('name is required');
    if (!exists(data.description)) errors.push('description is required');
    if (!exists(data.invitation_limit)) errors.push('invitation_limit is required');
  }

  // Validate field types and constraints if they exist
  if (exists(data.slug)) {
    if (typeof data.slug !== 'string') {
      errors.push('slug must be a string');
    } else if (data.slug.length < 3 || data.slug.length > 50) {
      errors.push('slug must be between 3 and 50 characters');
    }
  }

  if (exists(data.name)) {
    if (typeof data.name !== 'string') {
      errors.push('name must be a string');
    } else if (data.name.length < 2 || data.name.length > 100) {
      errors.push('name must be between 2 and 100 characters');
    }
  }

  if (exists(data.description)) {
    if (typeof data.description !== 'string') {
      errors.push('description must be a string');
    }
  }

  if (exists(data.invitation_limit)) {
    if (!Number.isInteger(data.invitation_limit)) {
      errors.push('invitation_limit must be an integer');
    } else if (data.invitation_limit < 0) {
      errors.push('invitation_limit must be a positive number');
    }
  }

  if (exists(data.allow_branding_removal)) {
    if (typeof data.allow_branding_removal !== 'boolean') {
      errors.push('allow_branding_removal must be a boolean');
    }
  }

  // Validate prices if present
  if (data.prices !== undefined) {
    if (!Array.isArray(data.prices)) {
      errors.push('prices must be an array');
    } else {
      // Check for duplicates in interval
      const intervals = data.prices.map(p => p.interval);
      const uniqueIntervals = new Set(intervals);
      if (uniqueIntervals.size !== intervals.length) {
        errors.push('duplicate price intervals are not allowed');
      }

      data.prices.forEach((price, index) => {
        if (!exists(price.amount)) {
          errors.push(`price[${index}]: amount is required`);
        } else if (typeof price.amount !== 'number') {
          errors.push(`price[${index}]: amount must be a number`);
        } else if (price.amount <= 0) {
          errors.push(`price[${index}]: amount must be greater than 0`);
        } else if (!Number.isInteger(price.amount)) {
          errors.push(`price[${index}]: amount must be an integer`);
        }

        if (!exists(price.interval)) {
          errors.push(`price[${index}]: interval is required`);
        } else if (!['day', 'week', 'month', 'year'].includes(price.interval)) {
          errors.push(`price[${index}]: interval must be one of: day, week, month, year`);
        }

        // Validate no unknown fields are present
        const allowedFields = new Set(['amount', 'interval', 'subscription_id']);
        const extraFields = Object.keys(price).filter(key => !allowedFields.has(key));
        if (extraFields.length > 0) {
          errors.push(`price[${index}]: unknown fields not allowed: ${extraFields.join(', ')}`);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};