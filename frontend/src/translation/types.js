/**
 * Translation engine types, confidence levels, and user-facing labels.
 */

export const CONFIDENCE_LEVELS = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

export const CONFIDENCE_LABELS = {
  high: "✓ उच्च विश्वसनीयता",
  medium: "~ अनुमानित अनुवाद",
  low: "⚠ कृपया अनुवाद की पुष्टि करें",
};

export const LOW_CONFIDENCE_MESSAGE = "अनुवाद की पुष्टि आवश्यक है";
