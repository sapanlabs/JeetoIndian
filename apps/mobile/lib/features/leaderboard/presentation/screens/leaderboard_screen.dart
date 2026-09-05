import 'package:flutter/material.dart';

class LeaderboardScreen extends StatelessWidget {
  final VoidCallback onBackToHome;
  const LeaderboardScreen({Key? key, required this.onBackToHome}) : super(key: key);

  final List<Map<String, dynamic>> _sampleLeaderboard = const [
    {"rank": 1, "name": "Rahul S.", "score": 200, "time": "11.4s", "prize": "Smartwatch Pro 5G"},
    {"rank": 2, "name": "Priya M.", "score": 200, "time": "14.2s", "prize": "Rs. 1000 Brand Voucher"},
    {"rank": 3, "name": "Amit K.", "score": 200, "time": "16.8s", "prize": "Rs. 1000 Brand Voucher"},
    {"rank": 4, "name": "Ananya R.", "score": 100, "time": "09.1s", "prize": "-"},
    {"rank": 5, "name": "Vikram P.", "score": 100, "time": "12.5s", "prize": "-"},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text("Live Leaderboard", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: onBackToHome,
        ),
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: const Color(0xFF1E293B),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Provisional Standings", style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13, fontWeight: FontWeight.bold)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF38BDF8).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text("REDIS ACCELERATED", style: TextStyle(color: Color(0xFF38BDF8), fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _sampleLeaderboard.length,
              itemBuilder: (context, index) {
                final entry = _sampleLeaderboard[index];
                final isTopThree = entry["rank"] <= 3;

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isTopThree ? const Color(0xFF1E293B) : const Color(0xFF0F172A),
                    border: Border.all(
                      color: isTopThree ? const Color(0xFFF59E0B).withOpacity(0.5) : const Color(0xFF334155),
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: entry["rank"] == 1
                              ? const Color(0xFFF59E0B)
                              : entry["rank"] == 2
                                  ? const Color(0xFF94A3B8)
                                  : entry["rank"] == 3
                                      ? const Color(0xFFB45309)
                                      : const Color(0xFF334155),
                        ),
                        child: Center(
                          child: Text(
                            "#${entry["rank"]}",
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              entry["name"],
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                            if (entry["prize"] != "-")
                              Text(
                                "Prize: ${entry["prize"]}",
                                style: const TextStyle(color: Color(0xFFF59E0B), fontSize: 12, fontWeight: FontWeight.w500),
                              ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text("${entry["score"]} pts", style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 15)),
                          Text(entry["time"], style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
