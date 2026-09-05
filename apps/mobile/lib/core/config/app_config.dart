class AppConfig {
  static const String appName = "JeetoIndian";
  static const String tagline = "India's Competitive Knowledge Platform";
  static const String apiBaseUrl = "http://localhost:3000/api/v1";

  // NON-NEGOTIABLE BUSINESS RULE & COMPLIANCE GUARDRAILS
  static const bool isFreeToPlay = true;
  static const bool allowPaidEntry = false;
  static const bool allowCashWallet = false;
  static const String freeBadgeText = "100% FREE ENTRY";
}
