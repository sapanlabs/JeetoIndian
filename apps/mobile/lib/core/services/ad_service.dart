import 'dart:async';

enum AdStatus { COMPLETED, SKIPPED, FAILED, UNAVAILABLE }

class AdResult {
  final AdStatus status;
  final String? message;
  AdResult(this.status, {this.message});
}

abstract class AdProvider {
  Future<bool> isAdAvailable(String placementId);
  Future<AdResult> showAd(String placementId);
}

/// Mock/Default Provider implementation for development and testing
class MockAdProvider implements AdProvider {
  @override
  Future<bool> isAdAvailable(String placementId) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return true; // Simulates available ad placement
  }

  @override
  Future<AdResult> showAd(String placementId) async {
    await Future.delayed(const Duration(milliseconds: 800));
    return AdResult(AdStatus.COMPLETED, message: "Monetization ad completed");
  }
}

class AdService {
  final AdProvider _provider;
  AdService({AdProvider? provider}) : _provider = provider ?? MockAdProvider();

  /**
   * Executes the non-blocking ad opportunity.
   * If ad is unavailable or fails, competition participation still succeeds for FREE.
   */
  Future<void> triggerJoinAdOpportunity(String competitionId) async {
    try {
      final available = await _provider.isAdAvailable("comp_join_$competitionId");
      if (available) {
        await _provider.showAd("comp_join_$competitionId");
      }
    } catch (e) {
      // Non-blocking fallback: Log error and allow user to continue for FREE
      print("Ad opportunity notice: ${e.toString()} (User continues for FREE)");
    }
  }
}
