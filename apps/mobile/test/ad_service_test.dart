import 'package:flutter_test/flutter_test.dart';
import 'package:jeeto_mobile/core/config/app_config.dart';
import 'package:jeeto_mobile/core/services/ad_service.dart';

class FailingAdProvider implements AdProvider {
  @override
  Future<bool> isAdAvailable(String placementId) async => true;

  @override
  Future<AdResult> showAd(String placementId) async {
    throw Exception("Network timeout showing ad");
  }
}

void main() {
  group('JeetoIndian Business Model & Ad Resilience Tests', () {
    test('Non-negotiable compliance guardrails must enforce FREE entry', () {
      expect(AppConfig.isFreeToPlay, isTrue);
      expect(AppConfig.allowPaidEntry, isFalse);
      expect(AppConfig.allowCashWallet, isFalse);
    });

    test('AdService must execute non-blocking fallback if ad provider fails', () async {
      final adService = AdService(provider: FailingAdProvider());

      // Should complete gracefully without throwing error or blocking the user
      expect(
        () async => await adService.triggerJoinAdOpportunity("comp_101"),
        returnsNormally,
      );
    });
  });
}
